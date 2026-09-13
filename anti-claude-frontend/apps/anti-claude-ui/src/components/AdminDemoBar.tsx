import React from 'react';
import { AlertCircle, MessageCircle, Flame, Award, RefreshCw, Zap, Volume2, VolumeX } from 'lucide-react';

interface AdminDemoBarProps {
  onTriggerCanvasCrisis: () => void;
  onTriggerCrushCrisis: () => void;
  onTriggerMicrowaveCrisis: () => void;
  onForcePromotion: () => void;
  onResetDemo: () => void;
  absurdityLevel: number;
  onSetAbsurdity: (lvl: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const AdminDemoBar: React.FC<AdminDemoBarProps> = ({
  onTriggerCanvasCrisis,
  onTriggerCrushCrisis,
  onTriggerMicrowaveCrisis,
  onForcePromotion,
  onResetDemo,
  absurdityLevel,
  onSetAbsurdity,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0c0d12]/95 backdrop-blur-md border-t border-[#26293a] px-6 py-2.5 z-50 shadow-2xl flex items-center justify-between">
      {/* Brand & Demo Tag */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-black tracking-wider uppercase shadow-lg">
          <Zap className="w-3.5 h-3.5 fill-current" />
          HACKATHON CHAOS BAR
        </span>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-md border text-xs font-mono flex items-center gap-1 transition ${
            soundEnabled
              ? 'bg-slate-800 text-emerald-400 border-slate-700'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[11px]">{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
        </button>
      </div>

      {/* Quick Panic Trigger Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTriggerCanvasCrisis}
          className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-bold font-mono transition shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          11:59 CANVAS LOCK
        </button>

        <button
          onClick={onTriggerCrushCrisis}
          className="px-3 py-1.5 bg-pink-600/90 hover:bg-pink-500 text-white rounded-lg text-xs font-bold font-mono transition shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          CRUSH DM PANIC
        </button>

        <button
          onClick={onTriggerMicrowaveCrisis}
          className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-white rounded-lg text-xs font-bold font-mono transition shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <Flame className="w-3.5 h-3.5" />
          MICROWAVE WAR
        </button>

        <button
          onClick={onForcePromotion}
          className="px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold font-mono transition shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <Award className="w-3.5 h-3.5" />
          FORCE WINGMAN TIER
        </button>
      </div>

      {/* Absurdity Dial & Reset Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <span>ABSURDITY:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSetAbsurdity(lvl)}
                className={`w-6 h-6 rounded text-xs font-bold transition ${
                  absurdityLevel === lvl
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onResetDemo}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition flex items-center gap-1 active:scale-95"
          title="Reset to initial 2.14 GPA demo state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RESET
        </button>
      </div>
    </div>
  );
};
