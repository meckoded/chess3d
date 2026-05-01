import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import useGameStore from '../store/gameStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineChip, HiOutlineUserGroup } from 'react-icons/hi';

const DIFFICULTY_LEVELS = [
  { key: 'beginner', label: 'Beginner', elo: '~800', desc: 'Perfect for learning' },
  { key: 'casual', label: 'Casual', elo: '~1200', desc: 'Relaxed games' },
  { key: 'intermediate', label: 'Intermediate', elo: '~1600', desc: 'Solid challenge' },
  { key: 'advanced', label: 'Advanced', elo: '~2000', desc: 'Serious opponent' },
  { key: 'expert', label: 'Expert', elo: '~2400', desc: 'Grandmaster level' },
];

const TIME_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
  { value: 900, label: '15 min' },
  { value: 1800, label: '30 min' },
  { value: 0, label: 'No limit' },
];

const INCREMENT_OPTIONS = [
  { value: 0, label: 'No increment' },
  { value: 1, label: '+1s' },
  { value: 2, label: '+2s' },
  { value: 3, label: '+3s' },
  { value: 5, label: '+5s' },
  { value: 10, label: '+10s' },
];

export default function Lobby() {
  const { user } = useAuthStore();
  const { waitingGames, activeGames, setGames, games } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [timeControl, setTimeControl] = useState(600);
  const [increment, setIncrement] = useState(0);
  const [gameMode, setGameMode] = useState('multiplayer');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [filter, setFilter] = useState('all');
  const [globalChat, setGlobalChat] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const navigate = useNavigate();

  const fetchGames = useCallback(async () => {
    try {
      const { data } = await api.get('/games');
      setGames(data.games || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [setGames]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  useEffect(() => {
    const int = setInterval(fetchGames, 10000);
    return () => clearInterval(int);
  }, [fetchGames]);

  const createGame = async () => {
    setCreating(true);
    try {
      const payload = {
        timeControl,
        increment,
      };
      if (gameMode === 'ai') {
        payload.isAI = true;
        payload.difficulty = difficulty;
      }
      const { data } = await api.post('/games/create', payload);
      toast.success('Game created!');
      navigate(`/game/${data.game.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create game');
    } finally {
      setCreating(false);
    }
  };

  const joinGame = async (id) => {
    try {
      await api.post(`/games/${id}/join`);
      navigate(`/game/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join game');
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    setGlobalChat((prev) => [...prev.slice(-99), { from: user?.username, message: chatMsg.trim(), time: new Date() }]);
    setChatMsg('');
  };

  const displayGames = filter === 'waiting' ? waitingGames :
    filter === 'active' ? activeGames : games;

  const timeLabel = TIME_OPTIONS.find(t => t.value === timeControl)?.label || '10 min';
  const incLabel = INCREMENT_OPTIONS.find(i => i.value === increment)?.label || '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Game */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/30"
          >
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Create New Game</h2>

            {/* Game Mode Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setGameMode('multiplayer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  gameMode === 'multiplayer'
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <HiOutlineUserGroup className="text-lg" />
                Multiplayer
              </button>
              <button
                onClick={() => setGameMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  gameMode === 'ai'
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <HiOutlineChip className="text-lg" />
                vs Computer
              </button>
            </div>

            {/* Time Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <select
                value={timeControl}
                onChange={(e) => setTimeControl(Number(e.target.value))}
                className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <select
                value={increment}
                onChange={(e) => setIncrement(Number(e.target.value))}
                className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
              >
                {INCREMENT_OPTIONS.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>

              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                {timeControl > 0 ? `${Math.floor(timeControl / 60)}+${increment}` : '∞'}
              </span>
            </div>

            {/* AI Difficulty */}
            {gameMode === 'ai' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4"
              >
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  AI Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_LEVELS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDifficulty(d.key)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        difficulty === d.key
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-500/10'
                      }`}
                      title={d.desc}
                    >
                      <div>{d.label}</div>
                      <div className="text-xs opacity-70">{d.elo}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Create Button */}
            <button
              onClick={createGame}
              disabled={creating}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25"
            >
              {creating ? 'Creating...' : gameMode === 'ai' ? `🤖 Play vs ${difficulty} (${timeLabel}${incLabel})` : `🎮 Create Game (${timeLabel}${incLabel})`}
            </button>
          </motion.div>

          {/* Game List */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Active Games</h2>
            <div className="flex gap-2">
              {['all', 'waiting', 'active'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading games...</div>
          ) : displayGames.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">No {filter} games found</div>
          ) : (
            <div className="space-y-3">
              {displayGames.map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-800 dark:text-white font-medium">
                        {game.white_username || '???'}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">vs</span>
                      <span className="text-slate-800 dark:text-white font-medium">
                        {game.black_username || (game.is_ai ? '🤖 AI' : '???')}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        game.status === 'waiting' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                        game.status === 'active' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-600/20 text-slate-500 dark:text-slate-400'
                      }`}>
                        {game.status}
                      </span>
                      {game.is_ai && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                          vs AI
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      {game.time_control > 0 ? `${Math.floor(game.time_control / 60)}m` : '∞'}
                      {game.increment > 0 ? `+${game.increment}s` : ''} •
                      {' '}Created {new Date(game.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {game.status === 'waiting' && game.white_player !== user?.id && !game.is_ai && (
                      <button
                        onClick={() => joinGame(game.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-all"
                      >
                        Join
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/game/${game.id}`)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-medium rounded-lg transition-all"
                    >
                      {game.status === 'active' ? 'Spectate' : 'View'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/30">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Your Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Rating</span>
                <span className="text-amber-500 font-medium">{user?.elo || user?.rating || 1200}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Played</span>
                <span className="text-slate-700 dark:text-white">{user?.games_played || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">W / L / D</span>
                <span className="text-slate-700 dark:text-white">{user?.wins || 0} / {user?.losses || 0} / {user?.draws || 0}</span>
              </div>
            </div>
            <Link to="/profile" className="block mt-4 text-center text-sm text-amber-500 hover:text-amber-400">View Full Profile →</Link>
          </div>

          {/* Global Chat */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/30 flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Lobby Chat</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
              {globalChat.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">No messages yet</p>
              )}
              {globalChat.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-amber-500 font-medium">{msg.from}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-600 dark:text-slate-300">{msg.message}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="Type a message..."
                maxLength={200}
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-medium rounded-lg">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
