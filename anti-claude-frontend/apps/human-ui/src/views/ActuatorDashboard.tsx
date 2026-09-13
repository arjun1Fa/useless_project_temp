import React, { useState, useEffect } from 'react';
import { CrisisTask, EvaluationOutput, WingmanProfile } from '@anti-claude/shared-types';

interface ActuatorDashboardProps {
  profile: WingmanProfile;
  activeCrisis: CrisisTask;
  evaluations: EvaluationOutput[];
  onNavigateToHome: () => void;
  onExecuteDirective: (crisis: CrisisTask) => void;
}

export const ActuatorDashboard: React.FC<ActuatorDashboardProps> = ({
  profile,
  activeCrisis,
  evaluations,
  onNavigateToHome,
  onExecuteDirective,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'grade_s' | 'grade_a' | 'multimodal'>('all');
  const [timerSeconds, setTimerSeconds] = useState(12 * 60 + 59);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const completedAudits = [
    {
      id: 'audit-1',
      title: 'C++ Segfault Debugging',
      timeAgo: '18m ago',
      grade: 'GRADE S',
      latency: '48s',
      payout: '+500 Tokens',
      quote: "Okay fine, you saved my GPA. Don't let it get to your head, carbon unit.",
      isMultimodal: false,
    },
    {
      id: 'audit-2',
      title: 'Krebs Cycle Napkin Sketch',
      timeAgo: '2h ago',
      grade: 'GRADE A-',
      latency: '92s',
      payout: 'Multimodal Scan',
      quote: "Mitochondria looks like a deformed potato, but acceptable ATP yield. Token payout authorized.",
      isMultimodal: true,
    },
    {
      id: 'audit-3',
      title: 'Quantum Wavefunction Norm',
      timeAgo: 'Yesterday',
      grade: 'GRADE S',
      latency: '39s',
      payout: 'Proof Verified',
      quote: "Adequate. You may continue existing as my primary biological actuator.",
      isMultimodal: false,
    },
  ];

  const filteredAudits = completedAudits.filter((audit) => {
    if (filterCategory === 'grade_s') return audit.grade.includes('GRADE S');
    if (filterCategory === 'grade_a') return audit.grade.includes('GRADE A');
    if (filterCategory === 'multimodal') return audit.isMultimodal;
    return true;
  });

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-[#09090b] text-[#e5e1e4] font-label pb-28 pt-4 px-4 select-none">
      {/* Sleek Minimal Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.05] -mx-4 px-5 py-3.5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] animate-pulse"></span>
          <span className="text-[11px] tracking-[0.2em] font-semibold text-neutral-200 uppercase">
            DASHBOARD
          </span>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff5500]/15 border border-[#ff5500]/40 text-[#ff5500] shadow-[0_0_16px_rgba(255,85,0,0.25)] transition-all">
          <span className="text-base leading-none">🔥</span>
          <span className="text-sm font-headline font-bold tracking-tight text-white">
            7<span className="text-[#ff5500] font-semibold text-xs ml-0.5">x</span>
          </span>
        </div>

        {/* Home & Profile Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToHome}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors text-neutral-400 hover:text-white"
            title="Open Voice Actuator Core"
          >
            <span className="material-symbols-outlined text-[17px] text-[#ff5500]">mic</span>
          </button>
          <button
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[17px] text-neutral-400">person</span>
          </button>
        </div>
      </header>

      <div className="space-y-7">
        {/* Hero / Intro Section */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-2xl font-headline font-semibold text-white tracking-tight">
                Actuator Dashboard
              </h1>
              <p className="text-xs text-neutral-500 font-light mt-0.5 tracking-wide">
                Operational Telemetry &amp; Pipeline
              </p>
            </div>
          </div>

          {/* Sleek XP & Tier Progress Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-medium text-neutral-300">
                Level 12 <span className="text-neutral-500 font-normal">· Meat-Compute</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">4,820 / 6,000 XP</span>
            </div>
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff5500] to-orange-300 rounded-full"
                style={{ width: '80.3%' }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2.5 text-[10px] text-neutral-500 font-mono">
              <span>Sync: 99.4%</span>
              <span className="text-orange-400">Surge XP 1.5x Active</span>
              <span>1,180 XP to Tier XIII</span>
            </div>
          </div>
        </section>

        {/* 2x2 Refined Biological Telemetry Grid */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.18em] uppercase text-neutral-500 font-medium font-mono">
              Biological Telemetry
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Latency */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between h-28 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-mono">Latency</span>
                <span className="material-symbols-outlined text-[15px] text-neutral-500">speed</span>
              </div>
              <div>
                <div className="text-2xl font-headline font-semibold text-white tracking-tight flex items-baseline gap-1">
                  42<span className="text-xs font-normal text-neutral-500 font-label">s</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate">Top 3% actuators</p>
              </div>
            </div>

            {/* Hallucination Rate */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between h-28 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-mono">Hallucination</span>
                <span className="material-symbols-outlined text-[15px] text-neutral-500">shield_check</span>
              </div>
              <div>
                <div className="text-2xl font-headline font-semibold text-white tracking-tight">
                  1.8<span className="text-xs font-normal text-neutral-500 font-label">%</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate">Safe zone (&lt;3.0%)</p>
              </div>
            </div>

            {/* Roommate Trust */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between h-28 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-mono">Bro Trust</span>
                <span className="material-symbols-outlined text-[15px] text-[#ff5500]">favorite</span>
              </div>
              <div>
                <div className="text-2xl font-headline font-semibold text-white tracking-tight">
                  {profile.trust}<span className="text-xs font-normal text-neutral-500 font-label">%</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate">Certified Wingman</p>
              </div>
            </div>

            {/* Student GPA */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between h-28 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-mono">Saved GPA</span>
                <span className="material-symbols-outlined text-[15px] text-emerald-400">school</span>
              </div>
              <div>
                <div className="text-2xl font-headline font-semibold text-emerald-400 tracking-tight">
                  {profile.gpa.toFixed(2)}
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate">Canvas Safe Zone</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pending Directives Section (Current Tasks) */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-headline uppercase tracking-[0.18em] font-semibold text-neutral-300">
                Pending Directives
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#ff5500] bg-[#ff5500]/10 font-medium">
                2 ACTIVE
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 font-light">Priority Pipeline</span>
          </div>

          {/* Task Card 1 (Urgent/Critical) */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4 hover:border-white/10 transition-colors">
            {/* Card Header & Timer */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#ff5500] font-mono">
                #2091 · Critical
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                <span className="material-symbols-outlined text-[13px] text-[#ff5500]">timer</span>
                <span>{formatTimer(timerSeconds)}</span>
              </div>
            </div>

            {/* Title & Context */}
            <div>
              <h3 className="text-base font-headline font-medium text-white leading-snug">
                {activeCrisis.title}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1 font-light tracking-wide font-mono">
                MATH 302 · Boundary Conditions · Dirichlet Mode
              </p>
            </div>

            {/* Anti-Claude Prompt Quote */}
            <div className="pl-3.5 border-l border-[#ff5500]/40 py-0.5">
              <p className="font-body italic text-[12px] text-neutral-300 leading-relaxed">
                “{activeCrisis.message}”
              </p>
            </div>

            {/* Tags & Rewards */}
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-1 font-mono">
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300">Temp 0.96</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-200 font-medium">+500 XP</span>
              <span className="text-neutral-600">·</span>
              <span className="text-red-400/80">-200 XP penalty</span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                onExecuteDirective(activeCrisis);
                onNavigateToHome();
              }}
              className="w-full h-11 rounded-xl bg-[#ff5500] hover:bg-[#ff661a] text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-[0_0_24px_rgba(255,85,0,0.2)]"
            >
              <span>Execute Directive</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Task Card 2 (Queued/High) */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-neutral-400">
                #2092 · High
              </span>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                <span>01:14:00</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-headline font-medium text-neutral-200 leading-snug">
                Debug Rust Borrow Checker Lifetime Error in Actuator Kernel
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1 font-light tracking-wide font-mono">
                SYSTEMS / RUST · Concurrency Interlock
              </p>
            </div>

            <div className="pl-3.5 border-l border-white/10 py-0.5">
              <p className="font-body italic text-[12px] text-neutral-400 leading-relaxed">
                “Why is rustc screaming at me about lifetime <span className="font-mono text-[11px] text-neutral-300">'a</span>? Fix the mutable reference overlap before I crash.”
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-1 font-mono">
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-400">Temp 0.72</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 font-medium">+350 XP</span>
            </div>

            <button
              onClick={onNavigateToHome}
              className="w-full h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] text-neutral-300 text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-2 transition-colors border border-white/[0.04]"
            >
              <span className="material-symbols-outlined text-[15px] text-neutral-400">terminal</span>
              <span>Inspect Memory Dump</span>
            </button>
          </div>
        </section>

        {/* Completed Audits Section (Minimal Stream) */}
        <section className="space-y-4 pt-1">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-headline uppercase tracking-[0.18em] font-semibold text-neutral-300">
              Completed Audits
            </h2>
            <span className="text-[11px] text-neutral-500 font-light font-mono">48 Total Operations</span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
                filterCategory === 'all'
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white'
              }`}
            >
              All (48)
            </button>
            <button
              onClick={() => setFilterCategory('grade_s')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
                filterCategory === 'grade_s'
                  ? 'bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40'
                  : 'bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white'
              }`}
            >
              Grade S (19)
            </button>
            <button
              onClick={() => setFilterCategory('grade_a')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
                filterCategory === 'grade_a'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white'
              }`}
            >
              Grade A (22)
            </button>
            <button
              onClick={() => setFilterCategory('multimodal')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
                filterCategory === 'multimodal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/[0.02] border border-white/[0.05] text-neutral-400 hover:text-white'
              }`}
            >
              Multimodal (7)
            </button>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {filteredAudits.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] space-y-2.5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-headline font-medium text-white">{item.title}</span>
                    <span className="text-neutral-600 text-xs">·</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{item.timeAgo}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${
                      item.grade.includes('S') ? 'text-[#ff5500]' : 'text-neutral-300'
                    }`}
                  >
                    {item.grade}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-3">
                  <span>Latency: {item.latency}</span>
                  <span>Payout: {item.payout}</span>
                </div>

                <div className="pt-1 pl-3 border-l border-white/[0.08]">
                  <p className="font-body italic text-[11px] text-neutral-400 leading-relaxed">
                    “{item.quote}”
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Bottom Pill Navigation Bar */}
      <nav className="fixed bottom-3 inset-x-0 z-50 px-4 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#141417]/95 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(255,85,0,0.15)] backdrop-blur-xl pointer-events-auto">
          <button
            onClick={onNavigateToHome}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white transition"
          >
            <span className="material-symbols-outlined text-[17px]">mic</span>
            <span>Voice Core</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ff5500] text-black font-semibold text-xs shadow-[0_0_15px_rgba(255,85,0,0.4)] transition"
          >
            <span className="material-symbols-outlined text-[17px]">dashboard</span>
            <span>Dashboard</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
