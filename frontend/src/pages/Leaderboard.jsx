import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/leaderboard?timeframe=${timeframe === 'all' ? '' : timeframe}&limit=50`);
        setPlayers(data.leaderboard || data.players || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [timeframe]);

  const filtered = search
    ? players.filter((p) => p.username?.toLowerCase().includes(search.toLowerCase()))
    : players;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Top Chess3D players ranked by ELO</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'month', label: 'This Month' },
              { key: 'week', label: 'This Week' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTimeframe(f.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  timeframe === f.key
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player..."
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/30 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[50px_1fr_70px_70px_70px_90px] sm:grid-cols-[60px_1fr_80px_80px_80px_100px] gap-2 sm:gap-4 p-4 border-b border-slate-200 dark:border-slate-700/30 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
            <div>Rank</div>
            <div>Player</div>
            <div className="text-center">ELO</div>
            <div className="text-center">Games</div>
            <div className="text-center">Win Rate</div>
            <div className="text-center">W/L/D</div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">No players found</div>
          ) : (
            filtered.map((player, i) => (
              <motion.div
                key={player.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[50px_1fr_70px_70px_70px_90px] sm:grid-cols-[60px_1fr_80px_80px_80px_100px] gap-2 sm:gap-4 p-4 border-b border-slate-100 dark:border-slate-700/20 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${
                  i < 3 ? 'bg-amber-50 dark:bg-amber-500/5' : ''
                }`}
              >
                <div className="flex items-center font-bold">
                  {i < 3 ? (
                    <span className={`text-lg ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'}`}>
                      {['🥇', '🥈', '🥉'][i]}
                    </span>
                  ) : (
                    <span className="text-slate-500">{i + 1}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-slate-800 dark:text-white font-medium truncate">{player.username}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-amber-500 font-bold">{player.rating}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{player.games_played}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{player.win_rate}%</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs text-emerald-400">{player.wins}</span>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs text-red-400">{player.losses}</span>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs text-slate-400">{player.draws}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
