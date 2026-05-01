import { useRef, useEffect } from 'react';

export default function MoveHistory({ moves, fen }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700/30">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Moves</h3>
      </div>
      <div className="p-3 max-h-[400px] overflow-y-auto">
        {moves.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-600 text-xs text-center py-4">No moves yet</p>
        ) : (
          <div className="space-y-0.5 text-xs font-mono">
            {Array.from({ length: Math.ceil(moves.length / 2) }, (_, row) => {
              const w = moves[row * 2];
              const b = moves[row * 2 + 1];
              return (
                <div key={row} className="grid grid-cols-[2.5rem_1fr_2.5rem_1fr] gap-x-2 py-0.5">
                  <span className="text-slate-400 dark:text-slate-500 text-right">{row + 1}.</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {w?.san || `${w?.from_square || ''}${w?.to_square || ''}`}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-right">
                    {b ? `${row + 1}...` : ''}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {b?.san || (b ? `${b.from_square || ''}${b.to_square || ''}` : '')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
