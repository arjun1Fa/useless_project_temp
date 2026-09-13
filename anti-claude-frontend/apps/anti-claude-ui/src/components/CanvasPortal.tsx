import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface CanvasPortalProps {
  assignmentTitle: string;
  dueSecondsRemaining: number;
  submitted: boolean;
  grade?: string;
}

export const CanvasPortal: React.FC<CanvasPortalProps> = ({
  assignmentTitle,
  dueSecondsRemaining,
  submitted,
  grade,
}) => {
  const [seconds, setSeconds] = useState(dueSecondsRemaining);

  useEffect(() => {
    setSeconds(dueSecondsRemaining);
  }, [dueSecondsRemaining]);

  useEffect(() => {
    if (seconds <= 0 || submitted) return;
    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, submitted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isUrgent = seconds < 120 && !submitted;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isUrgent
        ? 'bg-rose-950/30 border-rose-600/70 shadow-[0_0_25px_rgba(225,29,72,0.3)] animate-pulse'
        : 'bg-[#161822] border-[#26293a]'
    }`}>
      {/* Canvas Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#26293a]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
            Canvas LMS // Submission Portal
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          Turnitin v9.4 Enabled
        </span>
      </div>

      {/* Assignment Details */}
      <div className="mt-3 flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" /> Current Assignment
          </div>
          <h4 className="text-sm font-bold text-slate-100 mt-1 line-clamp-1">
            {assignmentTitle}
          </h4>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Weight: 35% of Final Grade (Non-negotiable)
          </div>
        </div>

        {/* Countdown Badge */}
        <div className="text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Portal Lock In</div>
          <div className={`text-xl font-mono font-black tracking-tight ${
            submitted
              ? 'text-emerald-400'
              : isUrgent
              ? 'text-rose-500 animate-bounce'
              : 'text-amber-400'
          }`}>
            {submitted ? 'SUBMITTED' : formatTime(seconds)}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-3 pt-3 border-t border-[#26293a] flex items-center justify-between text-xs">
        {submitted ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Received at 11:58:43 PM (Safe!)
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <ShieldAlert className="w-4 h-4" /> 0 Grace Period. Late submissions receive an automatic 0.
          </div>
        )}

        {grade && (
          <div className="flex items-center gap-1 font-mono font-bold">
            <span className="text-slate-400">Grade:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-black ${
              grade === 'S' || grade === 'A'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                : 'bg-rose-900/60 text-rose-300 border border-rose-700'
            }`}>
              {grade}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
