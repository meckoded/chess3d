import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import useGameStore from '../store/gameStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';

export default function Lobby() {
  const { user } = useAuthStore();
  const { waitingGames, activeGames, setGames, games } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [timeControl, setTimeControl] = useState(600);
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

  // Re-fetch every 10s
  useEffect(() => {
    const int = setInterval(fetchGames, 10000);
    return () => clearInterval(int);
  }, [fetchGames]);

  const createGame = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/games/create', { timeControl });
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Game */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Game</h2>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={timeControl}
                onChange={(e) => setTimeControl(Number(e.target.value))}
                className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value={60}>1 min</option>
                <option value={180}>3 min</option>
                <option value={300}>5 min</option>
                <option value={600}>10 min</option>
                <option value={900}>15 min</option>
                <option value={1800}>30 min</option>
                <option value={0}>No limit</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => createGame('white')}
                  disabled={creating}
                  className="px-6 py-2.5 bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-900 font-medium rounded-xl transition-all"
                >
                  Play White
                </button>
                <button
                  onClick={() => createGame('black')}
                  disabled={creating}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
                >
                  Play Black
                </button>
              </div>
            </div>
          </motion.div>

          {/* Game List */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Active Games</h2>
            <div className="flex gap-2">
              {['all', 'waiting', 'active'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === f ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading games...</div>
          ) : displayGames.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No {filter} games found</div>
          ) : (
            <div className="space-y-3">
              {displayGames.map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-amber-500/20 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        {game.white_username || '???'} 
                      </span>
                      <span className="text-slate-500">vs</span>
                      <span className="text-white font-medium">
                        {game.black_username || '???'}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        game.status === 'waiting' ? 'bg-emerald-500/20 text-emerald-400' :
                        game.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-600/20 text-slate-400'
                      }`}>
                        {game.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {game.time_control > 0 ? `${Math.floor(game.time_control / 60)}m` : '∞'} • 
                      {' '}Created {new Date(game.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {game.status === 'waiting' && game.white_player !== user?.id && (
                      <button
                        onClick={() => joinGame(game.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-all"
                      >
                        Join
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/game/${game.id}`)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
                    >
                      {game.status === 'active' ? 'Spectate' : 'View'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — Chat + Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="p-5 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30">
            <h3 className="text-lg font-bold text-white mb-3">Your Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Rating</span><span className="text-amber-400 font-medium">{user?.rating || 1200}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Played</span><span className="text-white">{user?.games_played || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">W / L / D</span><span className="text-white">{user?.wins || 0} / {user?.losses || 0} / {user?.draws || 0}</span></div>
            </div>
            <Link to="/profile" className="block mt-4 text-center text-sm text-amber-500 hover:text-amber-400">View Full Profile →</Link>
          </div>

          {/* Global Chat */}
          <div className="p-5 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-white mb-3">Lobby Chat</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
              {globalChat.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No messages yet</p>
              )}
              {globalChat.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-amber-500 font-medium">{msg.from}</span>
                  <span className="text-slate-600 mx-1">·</span>
                  <span className="text-slate-300">{msg.message}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
