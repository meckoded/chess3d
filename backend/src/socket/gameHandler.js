const jwt = require('jsonwebtoken');
const Game = require('../models/Game');
const User = require('../models/User');
const chessEngine = require('../services/chessEngine');
const ratingService = require('../services/rating');
const clockService = require('../services/clock');
const logger = require('../config/logger');

// Track active socket connections: { socketId: { userId, username, gameId, color } }
const activeConnections = new Map();

// Track game rooms: { gameId: Set<socketId> }
const gameRooms = new Map();

const setupGameHandler = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id;
      socket.username = decoded.username;
      socket.rating = user.rating;
      socket.role = decoded.role;

      logger.info(`Socket connected: ${socket.username} (${socket.id})`);
      next();
    } catch (err) {
      logger.error('Socket auth error:', err.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    activeConnections.set(socket.id, {
      userId: socket.userId,
      username: socket.username,
      gameId: null,
      color: null,
    });

    // Send confirmation to the client
    socket.emit('connected', {
      message: 'Authenticated successfully',
      userId: socket.userId,
      username: socket.username,
      rating: socket.rating,
    });

    /**
     * join_game — Join a game room.
     * Client sends: { gameId }
     * Server validates the user is a player, joins the room, emits game_update.
     */
    socket.on('join_game', async (data) => {
      try {
        const { gameId } = data;

        if (!gameId) {
          socket.emit('error', { message: 'gameId is required' });
          return;
        }

        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Check if user is a player
        const isWhite = game.white_player === socket.userId;
        const isBlack = game.black_player === socket.userId;

        if (!isWhite && !isBlack) {
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }

        const color = isWhite ? 'white' : 'black';

        // Leave any previous game room
        const prevInfo = activeConnections.get(socket.id);
        if (prevInfo && prevInfo.gameId) {
          socket.leave(`game:${prevInfo.gameId}`);
          removeFromGameRoom(prevInfo.gameId, socket.id);
        }

        // Join the new game room
        socket.join(`game:${gameId}`);
        addToGameRoom(gameId, socket.id);

        // Update connection tracking
        activeConnections.set(socket.id, {
          userId: socket.userId,
          username: socket.username,
          gameId,
          color,
        });

        // Get moves
        const moves = await Game.getMoves(gameId);

        // Emit game state to the joining player
        socket.emit('game_update', {
          game,
          moves,
          color,
          message: `You joined game ${gameId} as ${color}`,
        });

        // Notify other player in the room
        socket.to(`game:${gameId}`).emit('opponent_connected', {
          username: socket.username,
          rating: socket.rating,
        });

        logger.info(`${socket.username} joined game room ${gameId} as ${color}`);
      } catch (err) {
        logger.error('join_game error:', err);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    /**
     * make_move — Make a move in a game.
     * Client sends: { gameId, from, to, promotion }
     * Server validates, executes the move, updates DB, emits game_update.
     */
    socket.on('make_move', async (data) => {
      try {
        const { gameId, from, to, promotion } = data;

        if (!gameId || !from || !to) {
          socket.emit('move_error', { message: 'gameId, from, and to are required' });
          return;
        }

        const connInfo = activeConnections.get(socket.id);
        if (!connInfo || connInfo.gameId !== gameId) {
          socket.emit('move_error', { message: 'You are not in this game' });
          return;
        }

        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('move_error', { message: 'Game not found' });
          return;
        }

        if (game.status !== 'active') {
          socket.emit('move_error', { message: 'Game is not active' });
          return;
        }

        const playerColor = connInfo.color[0]; // 'w' or 'b'

        // ⏱ Server-side time enforcement
        const clockState = clockService.processMove(game, playerColor);
        if (clockState.isTimeout) {
          const winnerColor = playerColor === 'w' ? 'b' : 'w';
          const winnerId = winnerColor === 'w' ? game.white_player : game.black_player;
          await Game.updateGame(gameId, {
            status: 'completed',
            result: `${winnerColor}_win`,
            winner: winnerId,
            white_time: clockState.whiteTime,
            black_time: clockState.blackTime,
            ended_at: new Date(),
          });
          // Update ratings
          try {
            const wp = await User.findById(game.white_player);
            const bp = await User.findById(game.black_player);
            const rt = winnerColor === 'white' ? 'white' : 'black';
            const ratings = ratingService.calculateNewRatings(wp.rating, bp.rating, rt);
            await User.updateRating(game.white_player, ratings.whiteNewRating, rt === 'white' ? 'win' : 'loss');
            await User.updateRating(game.black_player, ratings.blackNewRating, rt === 'black' ? 'win' : 'loss');
          } catch (e) { logger.error('Timeout ELO error:', e); }

          const finalGame = await Game.findById(gameId);
          io.to(`game:${gameId}`).emit('game_over', {
            result: `${winnerColor}_win`,
            winner: winnerId,
            byTimeout: true,
            timeoutColor: playerColor === 'w' ? 'white' : 'black',
            game: finalGame,
          });
          return;
        }
        await Game.updateTime(gameId, clockState.whiteTime, clockState.blackTime);

        // Create chess instance
        const chess = chessEngine.createGame(game.fen);

        // Check turn
        if (!chessEngine.isCorrectTurn(chess, playerColor)) {
          socket.emit('move_error', { message: 'It is not your turn' });
          return;
        }

        // Attempt move
        const moveResult = chessEngine.makeMove(chess, { from, to, promotion });

        if (!moveResult.success) {
          socket.emit('move_error', { message: moveResult.error });
          return;
        }

        // Save to DB
        const existingMoves = await Game.getMoves(gameId);
        const moveNumber = existingMoves.length + 1;

        await Game.addMove({
          gameId,
          moveNumber,
          playerColor,
          fromSquare: from,
          toSquare: to,
          promotion: promotion || null,
          fenBefore: moveResult.fenBefore,
          fenAfter: moveResult.fenAfter,
        });

        // Update game state
        const state = chessEngine.getGameState(chess);
        const updateData = { fen: state.fen, pgn: state.pgn };
        let resultInfo = null;

        if (state.isGameOver) {
          updateData.status = 'completed';
          updateData.ended_at = new Date();

          if (state.isCheckmate) {
            const winnerColor = state.turn === 'w' ? 'b' : 'w';
            const winnerId = winnerColor === 'w' ? game.white_player : game.black_player;
            updateData.winner = winnerId;
            updateData.result = `${winnerColor}_win`;
          } else if (state.isDraw || state.isStalemate) {
            updateData.result = 'draw';
          }

          resultInfo = {
            result: updateData.result,
            winner: updateData.winner || null,
            checkmate: state.isCheckmate,
            draw: state.isDraw || state.isStalemate,
          };

          // Update ratings
          try {
            const whitePlayer = await User.findById(game.white_player);
            const blackPlayer = await User.findById(game.black_player);

            let ratingResultType;
            if (updateData.result === 'white_win') ratingResultType = 'white';
            else if (updateData.result === 'black_win') ratingResultType = 'black';
            else ratingResultType = 'draw';

            const ratings = ratingService.calculateNewRatings(
              whitePlayer.rating,
              blackPlayer.rating,
              ratingResultType,
            );

            const whiteResultType = ratingResultType === 'white' ? 'win' : ratingResultType === 'black' ? 'loss' : 'draw';
            const blackResultType = ratingResultType === 'black' ? 'win' : ratingResultType === 'white' ? 'loss' : 'draw';

            const updatedWhite = await User.updateRating(game.white_player, ratings.whiteNewRating, whiteResultType);
            const updatedBlack = await User.updateRating(game.black_player, ratings.blackNewRating, blackResultType);

            resultInfo.ratingChanges = {
              white: { old: whitePlayer.rating, new: updatedWhite.rating, change: ratings.whiteChange },
              black: { old: blackPlayer.rating, new: updatedBlack.rating, change: ratings.blackChange },
            };
          } catch (ratingErr) {
            logger.error('Socket rating update error:', ratingErr);
          }
        }

        await Game.updateGame(gameId, updateData);

        // Get full updated game
        const updatedGame = await Game.findById(gameId);
        const allMoves = await Game.getMoves(gameId);

        // Format the move info for broadcasting
        const moveInfo = {
          move: moveResult.move,
          game: updatedGame,
          moves: allMoves,
          fen: moveResult.fenAfter,
          isCheck: state.isCheck,
          isGameOver: state.isGameOver,
          isCheckmate: state.isCheckmate,
          isDraw: state.isDraw,
          isStalemate: state.isStalemate,
          playedBy: socket.username,
          result: resultInfo,
        };

        // Broadcast game_update to ALL players in the room
        io.to(`game:${gameId}`).emit('game_update', moveInfo);

        // If game over, also emit the specific event
        if (state.isGameOver) {
          io.to(`game:${gameId}`).emit('game_over', {
            result: updateData.result,
            winner: updateData.winner || null,
            byCheckmate: state.isCheckmate,
            byDraw: !state.isCheckmate,
            ratingChanges: resultInfo?.ratingChanges || null,
            game: updatedGame,
          });
        }

        logger.info(`Socket move: ${socket.username} played ${from}→${to} in game ${gameId}`);
      } catch (err) {
        logger.error('make_move socket error:', err);
        socket.emit('move_error', { message: 'Failed to process move' });
      }
    });

    /**
     * chat_message — Send a chat message in a game room.
     * Client sends: { gameId, message }
     * Broadcasts to all players in the room.
     */
    socket.on('chat_message', (data) => {
      try {
        const { gameId, message } = data;

        if (!gameId || !message || message.trim().length === 0) {
          socket.emit('error', { message: 'gameId and message are required' });
          return;
        }

        const connInfo = activeConnections.get(socket.id);
        if (!connInfo || connInfo.gameId !== gameId) {
          socket.emit('error', { message: 'You are not in this game' });
          return;
        }

        const chatMessage = {
          from: socket.username,
          userId: socket.userId,
          message: message.trim().substring(0, 500),
          color: connInfo.color,
          timestamp: new Date().toISOString(),
        };

        io.to(`game:${gameId}`).emit('chat_message', chatMessage);
      } catch (err) {
        logger.error('chat_message error:', err);
      }
    });

    /**
     * leave_game — Leave a game room.
     */
    socket.on('leave_game', (data) => {
      try {
        const { gameId } = data || activeConnections.get(socket.id) || {};

        if (!gameId) return;

        socket.leave(`game:${gameId}`);
        removeFromGameRoom(gameId, socket.id);

        const connInfo = activeConnections.get(socket.id);
        if (connInfo) {
          activeConnections.set(socket.id, {
            ...connInfo,
            gameId: null,
            color: null,
          });
        }

        // Notify remaining players
        io.to(`game:${gameId}`).emit('opponent_disconnected', {
          username: socket.username,
          userId: socket.userId,
        });

        logger.info(`${socket.username} left game room ${gameId}`);
      } catch (err) {
        logger.error('leave_game error:', err);
      }
    });

    /**
     * spectate_game — Spectate a game room.
     * Client sends: { gameId }
     */
    socket.on('spectate_game', async (data) => {
      try {
        const { gameId } = data;

        if (!gameId) {
          socket.emit('error', { message: 'gameId is required' });
          return;
        }

        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        socket.join(`game:${gameId}`);

        const moves = await Game.getMoves(gameId);

        socket.emit('game_update', {
          game,
          moves,
          color: 'spectator',
          message: `You are spectating game ${gameId}`,
        });

        logger.info(`${socket.username} is spectating game ${gameId}`);
      } catch (err) {
        logger.error('spectate_game error:', err);
        socket.emit('error', { message: 'Failed to spectate game' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      const connInfo = activeConnections.get(socket.id);

      if (connInfo && connInfo.gameId) {
        removeFromGameRoom(connInfo.gameId, socket.id);

        io.to(`game:${connInfo.gameId}`).emit('opponent_disconnected', {
          username: socket.username,
          userId: socket.userId,
        });
      }

      activeConnections.delete(socket.id);
      logger.info(`Socket disconnected: ${socket.username || 'unknown'} (${socket.id})`);
    });

    /**
     * ping — Keep the socket alive.
     */
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    /**
     * draw_offer — Forward draw offer to opponent.
     */
    socket.on('draw_offer', (data) => {
      const { gameId } = data;
      if (!gameId) return;
      socket.to(`game:${gameId}`).emit('draw_offered', {
        offeredBy: socket.username,
        userId: socket.userId,
      });
    });

    /**
     * draw_accept — Forward draw acceptance to opponent.
     */
    socket.on('draw_accept', (data) => {
      const { gameId } = data;
      if (!gameId) return;
      socket.to(`game:${gameId}`).emit('draw_accepted', { by: socket.username });
    });

    /**
     * draw_decline — Forward draw decline to opponent.
     */
    socket.on('draw_decline', (data) => {
      const { gameId } = data;
      if (!gameId) return;
      socket.to(`game:${gameId}`).emit('draw_declined', { by: socket.username });
    });
  });
};

// --- Room management ---

const addToGameRoom = (gameId, socketId) => {
  if (!gameRooms.has(gameId)) {
    gameRooms.set(gameId, new Set());
  }
  gameRooms.get(gameId).add(socketId);
};

const removeFromGameRoom = (gameId, socketId) => {
  const room = gameRooms.get(gameId);
  if (room) {
    room.delete(socketId);
    if (room.size === 0) {
      gameRooms.delete(gameId);
    }
  }
};

const getGameRoomOccupants = (gameId) => {
  const room = gameRooms.get(gameId);
  return room ? Array.from(room) : [];
};

module.exports = { setupGameHandler, getGameRoomOccupants };
