import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [statsRes, gamesRes] = await Promise.all([
          api.get('/users/stats'),
          api.get('/games?playerId=' + user.id + '&status=completed&limit=20'),
        ]);
        setStats(statsRes.data.stats || statsRes.data);
        setRecentGames(gamesRes.data.games || []);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user.id]);

  const handleSave = async () => {
    if (username.length < 3) return toast.error('Username too short');
    try {
      const { data } = await api.patch('/users/profile', { username });
      updateUser(data.user);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="p-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 mb-8">
          <div className="flex items-start justify-between">
            <div>
              {editing ? (
                <div className="flex items-center gap-3 mb-4">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button onClick={handleSave} className="px-4 py-2 bg-amber-500 text-slate-900 rounded-xl font-medium text-sm">Save</button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm">Cancel</button>
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
              )}
              <p className="text-slate-400">{user?.email}</p>
              <p className="text-sm text-slate-500 mt-1">Joined {new Date(user?.created_at).toLocaleDateString('he-IL')}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-amber-500">{user?.rating || 1200}</div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">ELO Rating</div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Games', value: stats?.total_games || 0 },
            { label: 'Wins', value: stats?.wins || 0, color: 'text-emerald-400' },
            { label: 'Losses', value: stats?.losses || 0, color: 'text-red-400' },
            { label: 'Draws', value: stats?.draws || 0, color: 'text-slate-400' },
            { label: 'Win Rate', value: `${stats?.win_rate || 0}%`, color: 'text-amber-400' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Games */}
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Games</h2>
          {recentGames.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No games played yet</p>
          ) : (
            <div className="space-y-3">
              {recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/20">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{game.white_username}</span>
                    <span className="text-xs text-slate-600">vs</span>
                    <span className="text-sm text-slate-300">{game.black_username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      game.result === 'draw' ? 'bg-slate-500/20 text-slate-400' :
                      (game.winner === user.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')
                    }`}>
                      {game.winner === user.id ? 'Win' : game.result === 'draw' ? 'Draw' : 'Loss'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(game.ended_at || game.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
