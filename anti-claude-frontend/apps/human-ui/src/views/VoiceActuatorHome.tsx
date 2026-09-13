import React, { useState, useRef } from 'react';
import { CrisisTask } from '@anti-claude/shared-types';

interface VoiceActuatorHomeProps {
  activeCrisis: CrisisTask;
  onSubmitResponse: (text: string, attachment?: string) => void;
  onNavigateToDashboard: () => void;
  onDraftChange: (text: string, hasAttachment: boolean) => void;
  isSubmitting?: boolean;
}

export const VoiceActuatorHome: React.FC<VoiceActuatorHomeProps> = ({
  activeCrisis,
  onSubmitResponse,
  onNavigateToDashboard,
  onDraftChange,
  isSubmitting = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isOrbActive, setIsOrbActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    onDraftChange(val, !!attachment);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setAttachment(result);
        onDraftChange(inputText, true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onDraftChange(inputText, false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;
    onSubmitResponse(inputText, attachment || undefined);
    setInputText('');
    setAttachment(null);
    setAttachmentName('');
    onDraftChange('', false);
  };

  return (
    <div className="relative w-full max-w-[420px] h-[860px] bg-black overflow-hidden flex flex-col justify-between px-6 pt-3 pb-8 border border-neutral-900 shadow-[0_0_90px_rgba(255,70,0,0.18)] rounded-[48px] mx-auto select-none">
      {/* Topographic Acoustic Contours */}
      <div aria-hidden="true" className="absolute -top-10 left-1/2 -translate-x-1/2 w-[480px] h-64 pointer-events-none opacity-40 topography-lines">
        <svg className="w-full h-full stroke-orange-500/20 stroke-[1.2]" fill="none" viewBox="0 0 500 240">
          <path d="M 40,2 C 140,80 360,80 460,2"></path>
          <path d="M 20,24 C 130,115 370,115 480,24" strokeOpacity="0.7"></path>
          <path d="M 5,50 C 120,150 380,150 495,50" strokeOpacity="0.5"></path>
          <path d="M 0,82 C 110,185 390,185 500,82" strokeOpacity="0.3"></path>
          <path d="M 0,118 C 100,225 400,225 500,118" strokeOpacity="0.15"></path>
        </svg>
      </div>

      {/* Header Section */}
      <header className="relative z-20 flex flex-col items-center pt-2">
        <div className="w-full flex items-center justify-between px-1 pt-1 pb-1">
          <button
            onClick={onNavigateToDashboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-neutral-400 hover:text-white transition"
          >
            <span className="material-symbols-outlined text-[15px] text-[#ff5500]">dashboard</span>
            <span>Dashboard</span>
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181c]/90 border border-[#ff5500]/30 shadow-[0_0_12px_rgba(255,85,0,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5500] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5500] shadow-[0_0_6px_#ff5500]"></span>
            </span>
            <span className="text-[11px] font-mono font-medium tracking-tight text-orange-200/90 uppercase">
              PANICKED (ONLINE)
            </span>
          </div>

          <div className="w-16 flex justify-end">
            <span className="text-[11px] font-mono text-neutral-500">2.14 GPA</span>
          </div>
        </div>

        <div className="flex items-center justify-center mt-1">
          <h2 className="text-2xl font-headline font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,85,0,0.4)]">
            Anti<span className="text-[#ff5500] font-black">—</span>Claude
          </h2>
        </div>
      </header>

      {/* Central Fluid Orb Zone */}
      <section className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div className="relative flex items-center justify-center w-64 h-64 my-1">
          {/* Concentric Audio Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-orange-500/10 pointer-events-none animate-pulse"></div>
          <div className="absolute w-56 h-56 rounded-full border border-orange-500/20 pointer-events-none"></div>
          <div className="absolute inset-4 rounded-full bg-[#ff4500]/15 blur-3xl scale-105 pointer-events-none"></div>

          {/* Morphing Molten Fluid Holographic Core */}
          <div
            onClick={() => setIsOrbActive(!isOrbActive)}
            aria-label="Anti-Claude organic molten fluid core"
            className={`relative w-48 h-48 fluid-orb cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95 flex items-center justify-center shadow-[0_0_60px_rgba(255,85,0,0.35)] ${
              isOrbActive ? 'scale-105 shadow-[0_0_80px_rgba(255,85,0,0.55)]' : ''
            }`}
            role="img"
          >
            <div className="absolute top-4 left-6 w-16 h-12 bg-white/25 rounded-full blur-[5px] rotate-[-28deg] pointer-events-none"></div>
            <div className="absolute inset-8 rounded-full bg-black/80 blur-md border border-orange-900/50 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#ff5500]/10 blur-sm pointer-events-none"></div>
            </div>
            <div className="absolute bottom-3 right-5 w-20 h-12 bg-orange-400/25 rounded-full blur-[8px] pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Prompt Query Directive Section */}
      <section className="relative z-20 px-1 mb-3 w-full flex flex-col justify-center">
        <div className="relative rounded-[24px] bg-[#16151a]/85 border border-[#ff5500]/30 shadow-[0_4px_30px_rgba(255,85,0,0.12),inset_0_1px_1px_rgba(255,181,156,0.2)] p-4 text-center backdrop-blur-md">
          <div className="flex items-center justify-between mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff5500]/15 border border-[#ff5500]/35 shadow-[0_0_10px_rgba(255,85,0,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500] animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-wider text-[#ff5500] font-semibold uppercase">
                DIRECTIVE // 04-B
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 uppercase tracking-tight font-bold">
              PRIORITY: CRITICAL
            </span>
          </div>

          <h1 className="text-[16px] leading-[1.35] font-headline font-medium text-white tracking-[-0.015em] mb-2 line-clamp-3">
            {activeCrisis.title}
          </h1>

          <p className="text-[12px] font-body italic text-neutral-300 line-clamp-2 px-1 mb-2.5">
            "{activeCrisis.message}"
          </p>

          <div className="flex items-center pt-2.5 border-t border-white/5 text-[11px] font-mono text-neutral-400 justify-center">
            <span className="inline-flex items-center gap-1 text-orange-300/80 font-bold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Deadline: 11:59 PM ({activeCrisis.timeLimitSeconds || 180}s remaining)
            </span>
          </div>
        </div>
      </section>

      {/* Attachment Preview (if uploaded for Gemini analysis) */}
      {attachment && (
        <div className="relative z-20 mb-2 p-2 rounded-xl bg-[#16151a] border border-[#ff5500]/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <img src={attachment} alt="proof" className="w-8 h-8 rounded object-cover border border-white/10" />
            <span className="truncate text-neutral-300 font-mono text-[11px]">{attachmentName}</span>
            <span className="text-[10px] font-mono text-[#ff5500]">Gemini Vision</span>
          </div>
          <button onClick={removeAttachment} className="text-neutral-400 hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* Bottom Actuator Bar */}
      <footer className="relative z-20 w-full pb-1">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#18181c]/95 border border-[#ff5500]/25 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_15px_rgba(255,85,0,0.12)] backdrop-blur-md ring-1 ring-white/5"
        >
          {/* Multimodal Attachment Button (Gemini Vision) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach multimodal screenshot or scan"
            className="p-2 rounded-full text-neutral-400 hover:text-[#ffb59c] hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">image</span>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={handleTextChange}
            disabled={isSubmitting}
            placeholder="Ask Anti-Claude or enter proof..."
            className="flex-1 bg-transparent border-0 text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:ring-0 p-0 font-label tracking-tight"
          />

          {/* Speech Mic Button */}
          <button
            type="button"
            aria-label="Activate microphone speech"
            className="p-2 rounded-full text-neutral-400 hover:text-[#ffb59c] hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!inputText.trim() && !attachment)}
            aria-label="Send input prompt"
            className="w-9 h-9 rounded-full bg-[#ff5500] hover:bg-[#ff6611] disabled:opacity-40 flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,85,0,0.5)] active:scale-90 transition-transform shrink-0"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.49-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"></path>
            </svg>
          </button>
        </form>
      </footer>

      {/* iOS Home Bar Indicator */}
      <div aria-hidden="true" className="w-32 h-1 bg-neutral-800 rounded-full mx-auto -mb-4 mt-2 opacity-60 pointer-events-none"></div>
    </div>
  );
};
