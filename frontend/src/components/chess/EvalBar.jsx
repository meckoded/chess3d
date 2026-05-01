import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function EvalBar({ gameId, fen }) {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchEval = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/games/${gameId}/evaluate`);
      setScore(data.score);
    } catch {
      // silent — not critical UX
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchEval();
  }, [fen, fetchEval]);

  // Clamp score to [-8, 8] for display
  const clamped = Math.max(-8, Math.min(8, score));
  // Convert to percentage: -8→0%, 0→50%, 8→100%
  const pct = ((clamped + 8) / 16) * 100;

  const whitePct = pct;
  const blackPct = 100 - pct;

  const isMate = Math.abs(score) > 99;

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700/30 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">📊 Evaluation</h3>
        <button
          onClick={fetchEval}
          disabled={loading}
          className="text-xs text-amber-500 hover:text-amber-400 disabled:opacity-40 font-medium"
          aria-label="Refresh evaluation"
        >
          {loading ? '...' : '↻'}
        </button>
      </div>

      <div className="p-3 space-y-2">
        {/* Score text */}
        <div className="text-center">
          <span className={`text-lg font-bold font-mono ${
            score > 0 ? 'text-slate-800 dark:text-white' :
            score < 0 ? 'text-slate-800 dark:text-white' :
            'text-slate-500 dark:text-slate-400'
          }`}>
            {isMate ? (score > 0 ? 'M+' : 'M-') : score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
          </span>
        </div>

        {/* Bar visualization */}
        <div className="relative w-full h-8 rounded-lg overflow-hidden bg-slate-700/30 flex">
          {/* White portion */}
          <motion.div
            className="h-full bg-slate-200 dark:bg-white"
            animate={{ width: `${whitePct}%` }}
            transition={{ duration: 0.3 }}
          />
          {/* Score line at center */}
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-500/50" />
          {/* Black portion fills the rest */}
          <motion.div
            className="h-full bg-slate-600 dark:bg-slate-700"
            animate={{ width: `${blackPct}%` }}
            transition={{ duration: 0.3 }}
          />

          {/* Score label on bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mix-blend-difference">
              {score > 0 ? '△' : score < 0 ? '▽' : '='}
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <span>White</span>
          <span>Black</span>
        </div>
      </div>
    </div>
  );
}
