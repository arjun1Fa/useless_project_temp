import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Flame, BookOpen, Heart, ShieldAlert, Sparkles } from 'lucide-react';
import { CrisisTask } from '@anti-claude/shared-types';

interface CrisisActiveCardProps {
  crisis: CrisisTask;
  onDecline: () => void;
}

export const CrisisActiveCard: React.FC<CrisisActiveCardProps> = ({ crisis, onDecline }) => {
  const [secondsLeft, setSecondsLeft] = useState(crisis.timeLimitSeconds || 180);

  useEffect(() => {
    setSecondsLeft(crisis.timeLimitSeconds || 180);
  }, [crisis]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = () => {
    switch (crisis.category) {
      case 'academic_cram':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'crush_dilemma':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'roommate_warfare':
        return <Flame className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  const isCritical = crisis.isEmergency || secondsLeft < 60;

  return (
    <div
      className={`p-6 rounded-2xl border transition-all shadow-2xl relative overflow-hidden ${
        isCritical
          ? 'bg-[#150f1a] border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.25)]'
          : 'bg-[#131825] border-[#1f273d]'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1f273d]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            {getCategoryIcon()}
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            {crisis.category.replace(/_/g, ' ')}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/50">
            Level {crisis.absurdityLevel}/5
          </span>
        </div>

        {/* Live Countdown Clock */}
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isCritical ? 'text-rose-500 animate-spin' : 'text-cyan-400'}`} />
          <span
            className={`font-mono font-black text-lg ${
              isCritical ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
            }`}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {crisis.isEmergency && (
        <div className="mt-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 flex items-center justify-between text-xs font-mono text-rose-300">
          <span className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
            CRITICAL EMERGENCY: {crisis.emergencyReason || 'Turnitin portal locks soon!'}
          </span>
          <span className="text-[10px] uppercase text-rose-400 font-bold">Immediate Action Required</span>
        </div>
      )}

      {/* Main Crisis Statement */}
      <div className="mt-4">
        <h2 className="text-lg font-black text-slate-100 tracking-tight">
          {crisis.title}
        </h2>
        <div className="mt-3 p-4 bg-[#0a0d14] rounded-xl border border-[#1f273d] text-slate-200 text-sm font-mono leading-relaxed relative">
          <span className="text-rose-400 font-bold text-xs uppercase tracking-wider block mb-1.5">
            Incoming Voice Memo from Anti-Claude:
          </span>
          "{crisis.message}"
        </div>
      </div>

      {/* Response Type & Bail Out Options */}
      <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-[#1f273d]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Expected Format: <strong className="text-cyan-300 uppercase">{crisis.expectedResponseType}</strong></span>
        </div>

        <button
          onClick={onDecline}
          className="text-slate-400 hover:text-rose-400 text-xs transition underline underline-offset-4"
        >
          Can't help right now (Bail out)
        </button>
      </div>
    </div>
  );
};
