import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, gamesRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/games'),
        api.get('/admin/stats'),
      ]);
      setUsers(usersRes.data.users || []);
      setGames(gamesRes.data.games || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const changeRole = async (id, role) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === id ? data.user : u));
      toast.success(`Role changed to ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = ['dashboard', 'users', 'games'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                activeTab === tab ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.total_users || 0 },
                { label: 'Total Games', value: stats.total_games || 0 },
                { label: 'Active Games', value: stats.active_games || 0, color: 'text-emerald-400' },
                { label: 'Completed', value: stats.completed_games || 0, color: 'text-blue-400' },
                { label: 'Waiting', value: stats.waiting_games || 0, color: 'text-yellow-400' },
                { label: 'Total Moves', value: stats.total_moves || 0 },
                { label: 'Avg Rating', value: stats.average_rating || 1200, color: 'text-amber-400' },
                { label: 'Top Player', value: stats.top_player || '—', color: 'text-amber-500' },
              ].map((s) => (
                <div key={s.label} className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={fetchData} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all">
              Refresh Data
            </button>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/30 overflow-hidden">
            <div className="grid grid-cols-[1fr_200px_120px_120px_120px_100px] gap-4 p-4 border-b border-slate-700/30 text-xs text-slate-500 uppercase font-medium">
              <div>User</div>
              <div>Email</div>
              <div className="text-center">Rating</div>
              <div className="text-center">Games</div>
              <div className="text-center">Role</div>
              <div className="text-center">Actions</div>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-[1fr_200px_120px_120px_120px_100px] gap-4 p-4 border-b border-slate-700/20 hover:bg-slate-700/10 text-sm">
                <div className="text-white font-medium">{u.username}</div>
                <div className="text-slate-400 truncate">{u.email}</div>
                <div className="text-center text-amber-500 font-bold">{u.rating}</div>
                <div className="text-center text-slate-400">{u.games_played}</div>
                <div className="text-center">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded-lg text-white text-xs px-2 py-1 focus:outline-none focus:border-amber-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="text-center">
                  <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="text-center py-12 text-slate-500">No users found</div>}
          </div>
        )}

        {/* Games */}
        {activeTab === 'games' && (
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/30 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_100px_100px_80px] gap-4 p-4 border-b border-slate-700/30 text-xs text-slate-500 uppercase font-medium">
              <div>White</div>
              <div>Black</div>
              <div className="text-center">Status</div>
              <div className="text-center">Result</div>
              <div className="text-center">Date</div>
            </div>
            {games.map((g) => (
              <div key={g.id} className="grid grid-cols-[1fr_1fr_100px_100px_80px] gap-4 p-4 border-b border-slate-700/20 text-sm hover:bg-slate-700/10">
                <div className="text-white">{g.white_username || '—'}</div>
                <div className="text-white">{g.black_username || '—'}</div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    g.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    g.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>{g.status}</span>
                </div>
                <div className="text-center text-slate-400">{g.result || '—'}</div>
                <div className="text-center text-xs text-slate-500">
                  {new Date(g.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
            {games.length === 0 && <div className="text-center py-12 text-slate-500">No games found</div>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
