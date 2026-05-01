import { motion } from 'framer-motion';

const PIECES = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

export default function PromotionDialog({ color, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 rounded-2xl bg-slate-800 border border-slate-600/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-center mb-4">Promote Pawn</h3>
        <div className="flex gap-3">
          {PIECES.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="w-16 h-16 rounded-xl bg-slate-700 hover:bg-amber-500/30 border border-slate-600 hover:border-amber-500/50 flex items-center justify-center transition-all"
              title={p.label}
            >
              <span className="text-2xl font-bold text-white">
                {color === 'w' ? p.type.toUpperCase() : p.type}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
