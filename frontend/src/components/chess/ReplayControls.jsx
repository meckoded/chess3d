import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ReplayControls({ moves, fen, onSeek }) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = starting position
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // ms between auto-moves
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          onSeek(next);
          return next;
        });
      }, playSpeed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, playSpeed, moves.length, onSeek]);

  const goToStart = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    onSeek(-1);
  };

  const goBack = () => {
    setIsPlaying(false);
    setCurrentIndex(prev => {
      const next = Math.max(-1, prev - 1);
      onSeek(next);
      return next;
    });
  };

  const goForward = () => {
    setIsPlaying(false);
    setCurrentIndex(prev => {
      const next = Math.min(moves.length - 1, prev + 1);
      if (next === prev) return prev;
      onSeek(next);
      return next;
    });
  };

  const goToEnd = () => {
    setIsPlaying(false);
    const last = moves.length - 1;
    setCurrentIndex(last);
    onSeek(last);
  };

  const togglePlay = () => setIsPlaying(p => !p);

  const formatIndex = (idx) => {
    if (idx < 0) return 'Start';
    const m = moves[idx];
    const num = Math.floor(idx / 2) + 1;
    const color = idx % 2 === 0 ? '' : '... ';
    return `${color}${num}. ${m?.san || `${m?.from_square}${m?.to_square}`}`;
  };

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700/30">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">🎬 Replay</h3>
      </div>

      <div className="p-3 space-y-3">
        {/* Current move indicator */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
          {formatIndex(currentIndex)}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            animate={{ width: `${moves.length ? ((currentIndex + 1) / moves.length) * 100 : 0}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToStart}
            className="px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 transition-all"
            title="Go to start"
            aria-label="Go to start of game"
          >
            ⏮
          </button>
          <button
            onClick={goBack}
            className="px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 transition-all"
            title="Previous move"
            aria-label="Previous move"
          >
            ◀
          </button>
          <button
            onClick={togglePlay}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={goForward}
            className="px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 transition-all"
            title="Next move"
            aria-label="Next move"
          >
            ▶
          </button>
          <button
            onClick={goToEnd}
            className="px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 transition-all"
            title="Go to end"
            aria-label="Go to end of game"
          >
            ⏭
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center justify-center gap-1">
          {[
            { label: '0.5x', speed: 2000 },
            { label: '1x', speed: 1000 },
            { label: '2x', speed: 500 },
            { label: '4x', speed: 200 },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => setPlaySpeed(opt.speed)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                playSpeed === opt.speed
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
