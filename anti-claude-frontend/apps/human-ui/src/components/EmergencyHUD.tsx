import React from 'react';
import { AlertTriangle, Flame, ShieldAlert } from 'lucide-react';

interface EmergencyHUDProps {
  active: boolean;
  reason?: string;
}

export const EmergencyHUD: React.FC<EmergencyHUDProps> = ({ active, reason }) => {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Flashing Red Screen Perimeter */}
      <div className="absolute inset-0 border-[6px] border-rose-600/80 animate-pulse shadow-[inset_0_0_80px_rgba(225,29,72,0.4)]"></div>

      {/* Top Warning Banner */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-rose-600 text-white font-mono font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-bounce">
        <ShieldAlert className="w-4 h-4 fill-current" />
        🚨 CRITICAL CAMPUS CRISIS IN PROGRESS: {reason || 'CANVAS SUBMISSION CLOSING'} 🚨
      </div>
    </div>
  );
};
