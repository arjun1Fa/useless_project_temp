import React, { useEffect, useRef } from 'react';
import { Terminal, Flame, Zap, AlertTriangle } from 'lucide-react';

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  source: 'GROK' | 'STUDENT' | 'CANVAS' | 'ROMANCE' | 'SYSTEM' | 'TELEMETRY' | 'PANIC';
  text: string;
  type?: 'panic' | 'urgent' | 'info' | 'success';
}

interface PanicTerminalProps {
  logs: TerminalLogEntry[];
  isStreaming?: boolean;
}

export const PanicTerminal: React.FC<PanicTerminalProps> = ({ logs, isStreaming = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getBadgeColor = (source: TerminalLogEntry['source']) => {
    switch (source) {
      case 'GROK':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      case 'STUDENT':
      case 'PANIC':
        return 'bg-rose-900/60 text-rose-300 border-rose-700/50';
      case 'CANVAS':
        return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
      case 'ROMANCE':
        return 'bg-pink-900/60 text-pink-300 border-pink-700/50';
      case 'TELEMETRY':
        return 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#11131a] border border-[#26293a] rounded-xl overflow-hidden shadow-2xl">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161822] border-b border-[#26293a]">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 pl-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            anti_claude_mind_stream.sh (grok-2.5)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40 animate-pulse">
              <Zap className="w-3 h-3" /> STREAMING THOUGHTS
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-400">11:42:09 PM</span>
        </div>
      </div>

      {/* Terminal Content Stream */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2.5 selection:bg-cyan-900 selection:text-cyan-200"
      >
        <div className="text-slate-400 border-b border-slate-800 pb-2 mb-3">
          *** ANTI-CLAUDE BRAIN MONITOR INITIALIZED ***<br />
          Current State: 17 Credits, 2.14 GPA, 4 Monsters consumed, Doomscrolling active.
        </div>

        {logs.map((log) => (
          <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
            <span className="text-slate-400 shrink-0 select-none">[{log.timestamp}]</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] uppercase font-bold rounded border shrink-0 ${getBadgeColor(
                log.source
              )}`}
            >
              {log.source}
            </span>
            <span
              className={
                log.type === 'panic'
                  ? 'text-rose-400 font-semibold flex items-center gap-1'
                  : log.type === 'urgent'
                  ? 'text-amber-300 font-medium'
                  : log.type === 'success'
                  ? 'text-emerald-300'
                  : 'text-slate-300'
              }
            >
              {log.type === 'panic' && <AlertTriangle className="w-3.5 h-3.5 inline text-rose-500 shrink-0" />}
              {log.text}
            </span>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center space-x-2 text-cyan-400 animate-pulse">
            <span>&gt;</span>
            <span className="inline-block w-2 h-4 bg-cyan-400"></span>
          </div>
        )}
      </div>

      {/* Terminal Footer Indicator */}
      <div className="px-4 py-2 bg-[#0c0d12] border-t border-[#26293a] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>NEURAL STRESS: CRITICAL (94%)</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>PROCASTINATION_LEVEL: MAXIMUM</span>
        </div>
      </div>
    </div>
  );
};
