import { useState, useEffect, useRef } from 'react';

export default function GameTimer({ timeControl, turn, isGameOver }) {
  const [whiteTime, setWhiteTime] = useState(timeControl);
  const [blackTime, setBlackTime] = useState(timeControl);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!timeControl || isGameOver) {
      clearInterval(intervalRef.current);
      return;
    }

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((t) => Math.max(0, t - 1));
      } else {
        setBlackTime((t) => Math.max(0, t - 1));
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [turn, isGameOver, timeControl]);

  if (!timeControl) return null;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const whiteLow = whiteTime < 30;
  const blackLow = blackTime < 30;

  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white" />
        <span className={`font-mono text-sm font-bold ${whiteLow ? 'text-red-400' : 'text-white'}`}>
          {fmt(whiteTime)}
        </span>
      </div>
      <div className="text-slate-600 text-xs">⏱</div>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm font-bold ${blackLow ? 'text-red-400' : 'text-white'}`}>
          {fmt(blackTime)}
        </span>
        <div className="w-2 h-2 rounded-full bg-slate-700 border border-slate-600" />
      </div>
    </div>
  );
}
