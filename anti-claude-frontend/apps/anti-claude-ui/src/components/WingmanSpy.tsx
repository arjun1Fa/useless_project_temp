import React from 'react';
import { Eye, UserCheck, Shield, AlertTriangle, MessageSquare, Terminal } from 'lucide-react';
import { WingmanProfile } from '@anti-claude/shared-types';

interface WingmanSpyProps {
  profile: WingmanProfile;
  activeResponseDraft?: string;
  hasAttachment?: boolean;
}

export const WingmanSpy: React.FC<WingmanSpyProps> = ({
  profile,
  activeResponseDraft = '',
  hasAttachment = false,
}) => {
  const getStatusBadge = () => {
    switch (profile.currentStatus) {
      case 'VIEWING_TASK':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-700/60 animate-pulse flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> READING CRISIS
          </span>
        );
      case 'COOKING_RESPONSE':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 animate-pulse flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" /> COOKING ADVICE
          </span>
        );
      case 'GHOSTED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-700/60 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> GHOSTING ME 💀
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> IDLE / SLACKING
          </span>
        );
    }
  };

  return (
    <div className="p-4 bg-[#161822] border border-[#26293a] rounded-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#26293a]">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-cyan-300">
            Wingman Surveillance Feed
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Human Stats Card */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-[#11131a] rounded-lg border border-[#26293a]">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Bro Standing</span>
          <div className="font-bold text-slate-200 mt-0.5">{profile.rank.replace(/_/g, ' ')}</div>
        </div>
        <div className="p-2 bg-[#11131a] rounded-lg border border-[#26293a]">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Student GPA Saved</span>
          <div className="font-mono font-bold text-emerald-400 mt-0.5">{profile.gpa.toFixed(2)} / 4.00</div>
        </div>
      </div>

      {/* Emotional Matrix Sliders */}
      <div className="mt-3 space-y-2 text-xs font-mono">
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Trust Level</span>
            <span className="text-cyan-300 font-bold">{profile.trust}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${profile.trust}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Annoyance / Rage</span>
            <span className="text-rose-400 font-bold">{profile.annoyance}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${profile.annoyance}%` }}></div>
          </div>
        </div>
      </div>

      {/* Real-time Draft Keystrokes Sniffer */}
      <div className="mt-3 pt-3 border-t border-[#26293a]">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-emerald-400" /> Incoming Submission Sniffer:
          </span>
          {hasAttachment && (
            <span className="text-cyan-400 text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
              📸 Screenshot Attached
            </span>
          )}
        </div>
        <div className="p-2.5 bg-[#0c0d12] rounded-lg border border-dashed border-[#26293a] text-xs font-mono text-slate-300 min-h-[48px] max-h-[72px] overflow-y-auto">
          {activeResponseDraft ? (
            <span className="text-slate-200">{activeResponseDraft}</span>
          ) : (
            <span className="text-slate-400 italic">Waiting for human keystrokes...</span>
          )}
        </div>
      </div>
    </div>
  );
};
