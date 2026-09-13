import React from 'react';
import { Heart, Instagram, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';

interface CrushStatusProps {
  crushName?: string;
  lastActive?: string;
  statusText?: string;
  readReceiptState?: 'UNOPENED' | 'READ' | 'TYPING' | 'THUMBS_UP';
}

export const CrushStatus: React.FC<CrushStatusProps> = ({
  crushName = 'Maya K. (Econ 101)',
  lastActive = 'Active 4m ago',
  statusText = 'Posted BeReal: "Study grind at library ☕"',
  readReceiptState = 'READ',
}) => {
  const getReceiptBadge = () => {
    switch (readReceiptState) {
      case 'TYPING':
        return <span className="text-cyan-400 animate-pulse flex items-center gap-1">Typing...</span>;
      case 'READ':
        return <span className="text-rose-400 font-bold">Left on Read (24m ago) 💀</span>;
      case 'THUMBS_UP':
        return <span className="text-amber-400">Reacted with 👍 (Catastrophic)</span>;
      default:
        return <span className="text-slate-400">Delivered</span>;
    }
  };

  return (
    <div className="p-4 bg-[#161822] border border-[#26293a] rounded-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#26293a]">
        <div className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-pink-300">
            Romantic Emergency Radar
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950/40 text-pink-400 border border-pink-800/40">
          Down Bad Level: 92%
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {/* Mock Avatar */}
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-pink-300">
              MK
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-100 truncate">{crushName}</h4>
            <span className="text-[10px] font-mono text-slate-400">{lastActive}</span>
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            {statusText}
          </p>
        </div>
      </div>

      {/* Real-time DM Status */}
      <div className="mt-3 p-2.5 bg-[#11131a] rounded-lg border border-[#26293a] flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-pink-400" /> DM Telemetry:
        </span>
        <span className="text-xs">{getReceiptBadge()}</span>
      </div>
    </div>
  );
};
