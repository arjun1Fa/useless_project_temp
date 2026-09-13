import React from 'react';
import { Award, GraduationCap, Shield, Heart, Zap, BookOpen, User } from 'lucide-react';
import { WingmanProfile, CampusMemory } from '@anti-claude/shared-types';

interface WingmanBadgeProps {
  profile: WingmanProfile;
  memories: CampusMemory[];
}

export const WingmanBadge: React.FC<WingmanBadgeProps> = ({ profile, memories }) => {
  const getRankBadgeStyle = () => {
    switch (profile.rank) {
      case 'CERTIFIED_WINGMAN':
      case 'CAMPUS_SAVIOR':
      case 'BROTHER_FOR_LIFE':
        return 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black shadow-lg shadow-cyan-500/30';
      case 'RELIABLE_LAB_PARTNER':
      case 'LATE_NIGHT_CRAM_BUDDY':
        return 'bg-blue-900/80 text-cyan-300 border border-blue-600 font-bold';
      default:
        return 'bg-rose-950/80 text-rose-300 border border-rose-800 font-bold';
    }
  };

  return (
    <div className="p-6 bg-[#131825] border border-[#1f273d] rounded-2xl shadow-xl flex flex-col space-y-5">
      {/* Student ID Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1f273d]">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            Wingman Student ID
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">ID: WM-9042</span>
      </div>

      {/* ID Card Hero */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-slate-950 shadow-md">
          <User className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-slate-100 truncate">{profile.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide ${getRankBadgeStyle()}`}>
              {profile.rank.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row: GPA & Bro Score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#1f273d]">
          <span className="text-[10px] font-mono uppercase text-slate-400">Student GPA Protected</span>
          <div className="text-xl font-mono font-black text-emerald-400 mt-0.5">
            {profile.gpa.toFixed(2)} <span className="text-xs text-slate-400">/ 4.00</span>
          </div>
        </div>

        <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#1f273d]">
          <span className="text-[10px] font-mono uppercase text-slate-400">Bro Loyalty Standing</span>
          <div className="text-xl font-mono font-black text-cyan-400 mt-0.5">
            {profile.score} <span className="text-xs text-slate-400">PTS</span>
          </div>
        </div>
      </div>

      {/* Relationship Dynamic Sliders */}
      <div className="space-y-2.5 pt-2 border-t border-[#1f273d] text-xs font-mono">
        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          Anti-Claude Emotional Meters:
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Roommate Trust:</span>
            <span className="text-cyan-300 font-bold">{profile.trust}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${profile.trust}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Academic Respect:</span>
            <span className="text-emerald-400 font-bold">{profile.respect}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${profile.respect}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Student Annoyance:</span>
            <span className="text-rose-400 font-bold">{profile.annoyance}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${profile.annoyance}%` }}></div>
          </div>
        </div>
      </div>

      {/* Persistent Campus Lore Memories */}
      <div className="pt-2 border-t border-[#1f273d]">
        <div className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Dorm Lore & Memories:
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {memories.map((mem) => (
            <div key={mem.id} className="p-2 rounded bg-[#0a0d14] border border-slate-800/80 text-[11px] font-mono text-slate-300 leading-snug">
              • {mem.fact}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
