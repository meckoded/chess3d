import { useRef, useEffect } from 'react';

export default function MoveHistory({ moves, fen }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  const formatMove = (move, i) => {
    const moveNum = Math.floor(i / 2) + 1;
    if (i % 2 === 0) {
      return `${moveNum}. ${move.san || `${move.from_square}→${move.to_square}`}`;
    }
    return `${move.san || `${move.from_square}→${move.to_square}`}`;
  };

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 overflow-hidden">
      <div className="p-3 border-b border-slate-700/30">
        <h3 className="text-sm font-bold text-white">Moves</h3>
      </div>
      <div className="p-3 max-h-[400px] overflow-y-auto">
        {moves.length === 0 ? (
          <p className="text-slate-600 text-xs text-center py-4">No moves yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
            {Array.from({ length: Math.ceil(moves.length / 2) }, (_, row) => (
              <div key={row} className="contents">
                <div className="text-slate-500">{row + 1}.</div>
                <div className="text-slate-300">
                  {moves[row * 2]?.san || `${moves[row * 2]?.from_square || ''}${moves[row * 2]?.to_square || ''}`}
                </div>
                <div className="text-slate-500 text-right">{row + 1}...</div>
                <div className="text-slate-300">
                  {moves[row * 2 + 1]?.san || (moves[row * 2 + 1] ? `${moves[row * 2 + 1]?.from_square || ''}${moves[row * 2 + 1]?.to_square || ''}` : '')}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
