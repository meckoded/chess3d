import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useGameStore from '../store/gameStore';
import useSocket from '../hooks/useSocket';
import GameScene from '../components/chess/GameScene';
import MoveHistory from '../components/chess/MoveHistory';
import GameTimer from '../components/chess/GameTimer';
import PromotionDialog from '../components/chess/PromotionDialog';
import ReplayControls from '../components/chess/ReplayControls';
import { playMove, playCapture, playCheck, playGameStart, playGameOver, playNotify, setMuted } from '../services/sounds';
import toast from 'react-hot-toast';

// Parse FEN to get the board at a specific move index
function fenAtIndex(fullFen, moves, index) {
  if (index < 0 || !moves.length) return fullFen;
  // Use a simple chess.js parser approach: replay moves up to index
  // We'll just return the original fen since server-side stores FEN per move
  // The server can provide this — for now use the last known fen
  const move = moves[index];
  return move?.fen || fullFen;
}

export default function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    fen, turn, gameState, players, moves, isCheck, isCheckmate, isDraw, isStalemate,
    result, legalMoves, selectedSquare, playerColor, opponent, gameMessages,
    drawOfferedBy, drawOfferedByMe, timeControl,
    setGameData, setFen, setGameState, setTurn, setPlayers, setMoves,
    setResult, setLegalMoves, setSelectedSquare, setCheckStatus,
    setOpponent, setPlayerColor, addMove, addGameMessage, showPromotionDialog, hidePromotionDialog,
    showPromotion, promotionCallback, promotionSquare,
    setDrawOffered, clearDrawOffer,
    soundEnabled, toggleSound,
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [resigning, setResigning] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // 🔁 Replay state
  const [replayIndex, setReplayIndex] = useState(-1);
  const [displayFen, setDisplayFen] = useState(null);
  const originalFenRef = useRef(null);

  // Sync sound mute state with store
  useEffect(() => { setMuted(!soundEnabled); }, [soundEnabled]);

  // Fetch initial game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        const { data } = await api.get(`/games/${id}`);
        const g = data.game || data;
        setGameData({
          gameId: id,
          fen: g.fen,
          gameState: g.status,
          turn: g.fen?.split(' ')[1] || 'w',
          players: {
            white: { id: g.white_player, username: g.white_username, rating: g.white_rating },
            black: { id: g.black_player, username: g.black_username, rating: g.black_rating },
          },
          moves: data.moves || [],
          timeControl: g.time_control,
        });
        originalFenRef.current = g.fen;
        // Build result info for completed games
        if (g.status === 'completed' && g.result) {
          setResult({
            result: g.result,
            winner: g.winner,
            game: g,
          });
        }
        const color = g.white_player === user.id ? 'white' : g.black_player === user.id ? 'black' : null;
        if (color) {
          setPlayerColor(color);
          setOpponent(color === 'white' ? players?.black : players?.white);
        }
        setLoading(false);
      } catch {
        toast.error('Game not found');
        navigate('/lobby');
      }
    };
    loadGame();
  }, [id]);

  // 🎬 Replay seek handler — reconstruct FEN by replaying moves
  const handleReplaySeek = useCallback((index) => {
    setReplayIndex(index);
    if (index < 0) {
      setDisplayFen(null); // Use live FEN
      return;
    }
    const move = moves[index];
    if (move?.fen) {
      setDisplayFen(move.fen);
    }
  }, [moves]);

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (isGameOver) {
        // Replay keys
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = Math.max(-1, replayIndex - 1);
          handleReplaySeek(next);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = Math.min(moves.length - 1, replayIndex + 1);
          if (next !== replayIndex) handleReplaySeek(next);
        } else if (e.key === 'Home') {
          e.preventDefault();
          handleReplaySeek(-1);
        } else if (e.key === 'End') {
          e.preventDefault();
          handleReplaySeek(moves.length - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isGameOver, replayIndex, moves.length, handleReplaySeek]);

  // Socket connection for real-time updates
  const socket = useSocket({
    gameId: id,
    onGameUpdate: (data) => {
      if (data.game) setGameData({ gameState: data.game.status });
      if (data.fen) setFen(data.fen);
      if (data.moves) setMoves(data.moves);
      if (data.isCheck !== undefined) {
        setCheckStatus(data.isCheck, data.isCheckmate, data.isStalemate, data.isDraw);
        if (data.isCheck) playCheck();
        else if (data.isCheckmate && data.isGameOver) playGameOver();
      }
      if (data.isGameOver && data.result) setResult(data);
      if (data.playedBy && data.move) {
        addMove(data.move);
        const move = data.move;
        if (move.captured || move.flags?.includes('c')) playCapture();
        else playMove();
      }
    },
    onGameOver: (data) => {
      setResult(data);
      playGameOver();
      setCheckStatus(false, data.byCheckmate || false, data.byDraw || false, false);
      if (data.byTimeout) {
        const meTimedOut = (playerColor === 'white' && data.timeoutColor === 'white') ||
                           (playerColor === 'black' && data.timeoutColor === 'black');
        toast(meTimedOut ? '⏰ You lost on time!' : '⏰ Opponent lost on time! You win!',
              { icon: '⏰' });
      } else if (data.ratingChanges) {
        toast.success(`Game over! Rating: ${data.ratingChanges.white.change > 0 ? '+' : ''}${data.ratingChanges.white.change}`);
      } else {
        toast.success('Game over!');
      }
    },
    onOpponentConnected: (data) => {
      setOpponent({ username: data.username, rating: data.rating });
      toast.success(`${data.username} connected`);
    },
    onOpponentDisconnected: (data) => {
      toast(`${data.username || 'Opponent'} disconnected`, { icon: '⚠️' });
    },
    onChatMessage: (data) => {
      addGameMessage(data);
    },
    onMoveError: (data) => {
      toast.error(data.message);
    },
    onDrawOffered: (data) => {
      setDrawOffered(data.offeredBy, false);
      toast(`${data.offeredBy} offers a draw`, { icon: '🤝' });
    },
    onDrawDeclined: () => {
      clearDrawOffer();
      toast('Draw offer declined', { icon: '✖️' });
    },
    onDrawAccepted: () => {
      clearDrawOffer();
      toast.success('Draw accepted!');
    },
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameMessages]);

  // Get legal moves for a square
  const fetchLegalMoves = async (square) => {
    try {
      const { data } = await api.get(`/games/${id}/moves/${square}`);
      setLegalMoves(data.moves || []);
      setSelectedSquare(square);
    } catch {
      // Could be spectator or not your turn
    }
  };

  const handleSquareClick = (square) => {
    // Exit replay mode if in it
    if (replayIndex >= 0) {
      handleReplaySeek(-1);
    }

    if (!square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      // Check if clicking a legal target
      const target = legalMoves.find((m) => m.to === square);
      if (target) {
        const from = selectedSquare;
        const to = square;

        // Check for promotion — pawn reaching final rank
        const currentFen = displayFen || fen;
        const placement = currentFen.split(' ')[0];
        const ranks = placement.split('/');
        const fromRank = turn === 'w' ? 8 - parseInt(from[1]) : parseInt(from[1]) - 1;
        const fromPiece = ranks[fromRank]?.[from.charCodeAt(0) - 97];
        const isPawnMove = fromPiece === (turn === 'w' ? 'P' : 'p');
        const isPromotionRank = turn === 'w' ? to.endsWith('8') : to.endsWith('1');
        const needsPromotion = isPawnMove && isPromotionRank;

        if (needsPromotion) {
          showPromotionDialog(square, (promotion) => {
            api.post(`/games/${id}/move`, { from, to, promotion });
            hidePromotionDialog();
            setSelectedSquare(null);
            setLegalMoves([]);
          });
        } else {
          api.post(`/games/${id}/move`, { from, to }).catch((err) => {
            toast.error(err.response?.data?.error || 'Invalid move');
          });
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      } else {
        // Clicking another of your own pieces — select it
        fetchLegalMoves(square);
      }
    } else {
      fetchLegalMoves(square);
    }
  };

  const handleResign = async () => {
    if (!confirm('Are you sure you want to resign?')) return;
    setResigning(true);
    try {
      await api.post(`/games/${id}/resign`);
      toast.error('You resigned');
    } catch {
      toast.error('Failed to resign');
    } finally {
      setResigning(false);
    }
  };

  const handleDrawOffer = async () => {
    try {
      await api.post(`/games/${id}/draw`, { action: 'offer' });
      setDrawOffered(user.username, true);
      socket?.emit('draw_offer', { gameId: id });
      toast.success('Draw offered');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to offer draw');
    }
  };

  const handleDrawAccept = async () => {
    try {
      await api.post(`/games/${id}/draw`, { action: 'accept' });
      clearDrawOffer();
      socket?.emit('draw_accept', { gameId: id });
      toast.success('Draw accepted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept draw');
    }
  };

  const handleDrawDecline = () => {
    clearDrawOffer();
    socket?.emit('draw_decline', { gameId: id });
    toast('Draw offer declined', { icon: '✖️' });
  };

  const handlePGNDownload = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/games/${id}/pgn`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-${id}.pgn`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PGN downloaded!');
    } catch (e) { toast.error('Could not download PGN'); }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket?.emit('chat_message', { gameId: id, message: chatInput.trim() });
    addGameMessage({ from: user.username, message: chatInput.trim(), userId: user.id, timestamp: new Date().toISOString() });
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isMyTurn = playerColor && turn === (playerColor === 'white' ? 'w' : 'b');
  const isGameOver = gameState === 'completed';
  const isSpectator = !playerColor;
  const activeFen = displayFen || fen;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Game Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 mb-4"
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-3 h-3 rounded-full bg-white dark:bg-slate-200 shadow-sm" />
            <span className="text-slate-800 dark:text-white font-medium text-sm sm:text-base">{players.white?.username || 'White'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">({players.white?.rating || '—'})</span>
            {turn === 'w' && !isGameOver && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">Turn</span>
            )}
          </div>
          <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">vs</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm" />
            <span className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">{players.black?.username || 'Black'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">({players.black?.rating || '—'})</span>
            {turn === 'b' && !isGameOver && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">Turn</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* 🎵 Sound toggle */}
          <button
            onClick={toggleSound}
            className="px-2 py-2 rounded-lg text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50"
            title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          {/* 👁 Spectator badge */}
          {isSpectator && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              👁 Spectating
            </span>
          )}

          {!isGameOver && playerColor && (
            <>
              <button onClick={handleDrawOffer} disabled={drawOfferedByMe} className="px-3 sm:px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs sm:text-sm font-medium rounded-lg transition-all disabled:opacity-40" title="Offer Draw">
                🤝 Draw
              </button>
              <button onClick={handleResign} disabled={resigning} className="px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs sm:text-sm font-medium rounded-lg transition-all">
                Resign
              </button>
            </>
          )}
          <button onClick={() => navigate('/lobby')} className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm rounded-lg transition-all">
            ← Lobby
          </button>
        </div>
      </motion.div>

      {/* Game Status Banner */}
      {isGameOver && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center"
        >
          <span className="text-amber-400 font-bold text-lg">
            {result.result === 'draw' ? 'Game Drawn! 🤝' :
             result.winner === user.id ? 'You Won! 🎉' : 'You Lost'}{' '}
          </span>
          {result.ratingChanges && (
            <span className="text-slate-400 dark:text-slate-300 ml-3">
              Rating: {result.ratingChanges.white.change > 0 ? '+' : ''}{result.ratingChanges.white.change}
            </span>
          )}
          <button onClick={handlePGNDownload} className="ml-4 px-3 py-1 bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg transition-all">
            📥 PGN
          </button>
        </motion.div>
      )}

      {/* Draw Offer Notification */}
      {!isGameOver && drawOfferedBy && drawOfferedBy !== user.username && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
        >
          <span className="text-amber-400 font-medium">
            🤝 {drawOfferedBy} offers a draw
          </span>
          <div className="flex gap-2">
            <button onClick={handleDrawAccept} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-all">
              Accept
            </button>
            <button onClick={handleDrawDecline} className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-all">
              Decline
            </button>
          </div>
        </motion.div>
      )}

      {/* Timer Bar */}
      {!isGameOver && timeControl && (
        <div className="mb-4">
          <GameTimer timeControl={timeControl} turn={turn} isGameOver={isGameOver} />
        </div>
      )}

      {/* Main Game Layout */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* 3D Board */}
        <GameScene onSquareClick={handleSquareClick} overrideFen={activeFen} />

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          {isMyTurn && !isGameOver && (
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-emerald-400 font-medium text-sm"
            >
              Your Turn
            </motion.div>
          )}
          {isCheck && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center text-red-400 font-medium text-sm">
              ⚠ Check!
            </div>
          )}

          {/* 🎬 Replay Controls — visible for completed games */}
          {isGameOver && moves.length > 0 && (
            <div className="mb-2">
              <ReplayControls
                moves={moves}
                fen={activeFen}
                onSeek={handleReplaySeek}
              />
            </div>
          )}

          {/* Replay indicator */}
          {replayIndex >= 0 && (
            <div className="p-2 rounded-lg text-xs text-center bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              📺 Replay — move {replayIndex + 1}/{moves.length}
            </div>
          )}

          {/* Move History */}
          <MoveHistory moves={moves} fen={activeFen} />

          {/* Game Chat */}
          <div className="flex flex-col h-[280px] rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700/30">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Game Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {gameMessages.length === 0 && (
                <p className="text-slate-400 dark:text-slate-600 text-xs text-center py-4">No messages yet</p>
              )}
              {gameMessages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="text-amber-500 font-medium">{msg.from || msg.username}</span>
                  <span className="text-slate-400 dark:text-slate-600 mx-1">·</span>
                  <span className="text-slate-600 dark:text-slate-300">{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 dark:border-slate-700/30 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="Chat..."
                maxLength={200}
              />
              <button type="submit" className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-medium rounded-lg">Send</button>
            </form>
          </div>
        </div>
      </div>

      {/* Promotion Dialog */}
      {showPromotion && (
        <PromotionDialog
          color={playerColor === 'white' ? 'w' : 'b'}
          onSelect={promotionCallback}
          onClose={hidePromotionDialog}
        />
      )}
    </div>
  );
}
