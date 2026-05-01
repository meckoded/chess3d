const express = require('express');
const Game = require('../models/Game');
const authenticate = require('../middleware/auth');
const { moveLimiter } = require('../middleware/rateLimiter');
const chessEngine = require('../services/chessEngine');
const ratingService = require('../services/rating');
const User = require('../models/User');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/games/create
 * Create a new game. The creator becomes the white player.
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { timeControl } = req.body;

    const game = await Game.create({
      whitePlayer: req.user.id,
      timeControl: timeControl || 600,
    });

    logger.info(`Game created: ${game.id} by ${req.user.username}`);

    return res.status(201).json({ game });
  } catch (err) {
    logger.error('Create game error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games
 * List games. Supports filters.
 * Query params: status (waiting|active|completed), playerId
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, playerId } = req.query;

    let games;
    if (playerId) {
      games = await Game.findByUser(playerId);
      if (status) {
        const statusList = status.split(',');
        games = games.filter(g => statusList.includes(g.status));
      }
    } else if (status) {
      games = await Game.findByStatus(status.split(','));
    } else {
      games = await Game.findByStatus(['waiting', 'active']);
    }

    return res.json({ games });
  } catch (err) {
    logger.error('Get games error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/:id
 * Get full game details.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json({ game });
  } catch (err) {
    logger.error('Get game error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/join
 * Join a waiting game as the black player.
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not available for joining' });
    }

    if (game.white_player === req.user.id) {
      return res.status(400).json({ error: 'Cannot join your own game' });
    }

    const updatedGame = await Game.joinGame(req.params.id, req.user.id);

    if (!updatedGame) {
      return res.status(400).json({ error: 'Game is no longer available' });
    }

    logger.info(`${req.user.username} joined game ${req.params.id}`);

    return res.json({ game: updatedGame });
  } catch (err) {
    logger.error('Join game error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/move
 * Make a move in a game.
 */
router.post('/:id/move', authenticate, moveLimiter, async (req, res) => {
  try {
    const { from, to, promotion } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'Move requires "from" and "to" squares' });
    }

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    // Determine player color
    const isWhite = game.white_player === req.user.id;
    const isBlack = game.black_player === req.user.id;

    if (!isWhite && !isBlack) {
      return res.status(403).json({ error: 'You are not a player in this game' });
    }

    const playerColor = isWhite ? 'w' : 'b';

    // Create chess engine instance from current FEN
    const chess = chessEngine.createGame(game.fen);

    // Check it's the correct player's turn
    if (!chessEngine.isCorrectTurn(chess, playerColor)) {
      return res.status(400).json({ error: 'It is not your turn' });
    }

    // Make the move
    const moveResult = chessEngine.makeMove(chess, { from, to, promotion });

    if (!moveResult.success) {
      return res.status(400).json({ error: moveResult.error });
    }

    // Save move to database
    const moveCount = await Game.getMoves(req.params.id);
    const moveNumber = moveCount.length + 1;

    await Game.addMove({
      gameId: req.params.id,
      moveNumber,
      playerColor,
      fromSquare: from,
      toSquare: to,
      promotion: promotion || null,
      fenBefore: moveResult.fenBefore,
      fenAfter: moveResult.fenAfter,
    });

    // Update game FEN and PGN
    const state = chessEngine.getGameState(chess);

    const updateData = {
      fen: state.fen,
      pgn: state.pgn,
    };

    // Check for game over
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
    }

    await Game.updateGame(req.params.id, updateData);

    // Handle ELO rating updates if game ended
    if (updateData.status === 'completed') {
      try {
        const whitePlayer = await User.findById(game.white_player);
        const blackPlayer = await User.findById(game.black_player);

        let resultType;
        if (updateData.result === 'white_win') {
          resultType = 'white';
        } else if (updateData.result === 'black_win') {
          resultType = 'black';
        } else {
          resultType = 'draw';
        }

        const ratings = ratingService.calculateNewRatings(
          whitePlayer.rating,
          blackPlayer.rating,
          resultType,
        );

        const whiteResultType = resultType === 'white' ? 'win' : resultType === 'black' ? 'loss' : 'draw';
        const blackResultType = resultType === 'black' ? 'win' : resultType === 'white' ? 'loss' : 'draw';

        await User.updateRating(game.white_player, ratings.whiteNewRating, whiteResultType);
        await User.updateRating(game.black_player, ratings.blackNewRating, blackResultType);
      } catch (ratingErr) {
        logger.error('Rating update error:', ratingErr);
        // Don't fail the move response for rating errors
      }
    }

    // Get updated game state
    const updatedGame = await Game.findById(req.params.id);

    logger.info(`Move ${moveNumber}: ${playerColor === 'w' ? 'White' : 'Black'} ${from}→${to} in game ${req.params.id}`);

    return res.json({
      move: moveResult.move,
      game: updatedGame,
      fen: moveResult.fenAfter,
      isCheck: state.isCheck,
      isGameOver: state.isGameOver,
      isCheckmate: state.isCheckmate,
      isDraw: state.isDraw,
      result: updateData.result || null,
    });
  } catch (err) {
    logger.error('Make move error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:id/resign
 * Resign from a game.
 */
router.post('/:id/resign', authenticate, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    const isWhite = game.white_player === req.user.id;
    const isBlack = game.black_player === req.user.id;

    if (!isWhite && !isBlack) {
      return res.status(403).json({ error: 'You are not a player in this game' });
    }

    const winnerId = isWhite ? game.black_player : game.white_player;
    const result = isWhite ? 'black_win' : 'white_win';

    await Game.updateGame(req.params.id, {
      status: 'completed',
      winner: winnerId,
      result,
      ended_at: new Date(),
    });

    const finalGame = await Game.findById(req.params.id);

    logger.info(`Game ${req.params.id}: ${req.user.username} resigned`);

    return res.json({ game: finalGame });
  } catch (err) {
    logger.error('Resign game error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/:id/moves/:square
 * Get legal moves for a piece at a given square.
 */
router.get('/:id/moves/:square', authenticate, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const chess = chessEngine.createGame(game.fen);
    const moves = chessEngine.getMoves(chess, req.params.square);

    return res.json({ moves, square: req.params.square });
  } catch (err) {
    logger.error('Get legal moves error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
