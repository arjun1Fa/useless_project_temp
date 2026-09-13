import React from 'react';
import { Award, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { AcademicStanding } from '@anti-claude/shared-types';

interface PromotionModalProps {
  open: boolean;
  onClose: () => void;
  newRank: AcademicStanding;
  proclamationText: string;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  open,
  onClose,
  newRank,
  proclamationText,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#131825] border-2 border-cyan-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              OFFICIAL DORM ROOM PROCLAMATION
            </span>
            <h3 className="text-lg font-black text-white">BRO STANDING ELEVATED!</h3>
          </div>
        </div>

        <div className="mt-5 text-center p-4 bg-[#0a0d14] rounded-xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400">YOU HAVE BEEN PROMOTED TO:</span>
          <div className="mt-1 text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
            {newRank.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed italic">
          "{proclamationText}"
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Accept Honorary Bro Honors
          </button>
        </div>
      </div>
    </div>
  );
};
