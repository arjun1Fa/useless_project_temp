import React from 'react';
import { Heart, Coffee, AlertOctagon, BatteryCharging } from 'lucide-react';

interface AnxietyMeterProps {
  anxietyLevel: number; // 0 to 100
  caffeineCans: number; // e.g. 4
  heartRate: number;    // e.g. 142
}

export const AnxietyMeter: React.FC<AnxietyMeterProps> = ({
  anxietyLevel,
  caffeineCans,
  heartRate,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 p-3 bg-[#161822] border border-[#26293a] rounded-xl">
      {/* Anxiety & Meltdown Gauge */}
      <div className="p-3 bg-[#11131a] rounded-lg border border-[#26293a]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-400">
            <AlertOctagon className="w-3.5 h-3.5" /> Anxiety Index
          </span>
          <span className="font-mono font-bold text-rose-400">{anxietyLevel}%</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(5, anxietyLevel))}%` }}
          ></div>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
          {anxietyLevel > 80 ? '⚠️ SPIRALING / EMERGENCY' : 'STRESSED & PROCRASTINATING'}
        </div>
      </div>

      {/* Caffeine Overdose Monitor */}
      <div className="p-3 bg-[#11131a] rounded-lg border border-[#26293a]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
            <Coffee className="w-3.5 h-3.5" /> Monster Energy
          </span>
          <span className="font-mono font-bold text-emerald-400">{caffeineCans} cans</span>
        </div>
        <div className="flex gap-1.5 my-1">
          {[1, 2, 3, 4, 5].map((can) => (
            <div
              key={can}
              className={`flex-1 h-3 rounded-sm transition-colors ${
                can <= caffeineCans
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-800'
              }`}
            ></div>
          ))}
        </div>
        <div className="mt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>Bloodstream: 72% taurine</span>
          <BatteryCharging className="w-3 h-3 text-emerald-400" />
        </div>
      </div>

      {/* Biological Heart Rate */}
      <div className="p-3 bg-[#11131a] rounded-lg border border-[#26293a]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
            <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Heart Rate
          </span>
          <span className="font-mono font-bold text-cyan-400">{heartRate} BPM</span>
        </div>
        <div className="flex items-center justify-between h-4 font-mono text-[11px] text-slate-400 mt-1">
          <span className="text-slate-400">Resting: 65</span>
          <span className="text-rose-400 font-bold">TACHYCARDIC</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400 font-mono">
          Awake for 31.4 hours straight
        </div>
      </div>
    </div>
  );
};
