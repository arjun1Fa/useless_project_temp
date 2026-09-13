import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Coffee,
  Skull,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Clock,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import {
  CrisisTask,
  EvaluationOutput,
  WingmanProfile,
  INITIAL_WINGMAN_PROFILE,
  PRECOMPILED_CRISES,
  MOCK_EVALUATIONS,
} from '@anti-claude/shared-types';
import { PanicTerminal, TerminalLogEntry } from './components/PanicTerminal';
import { AnxietyMeter } from './components/AnxietyMeter';
import { CanvasPortal } from './components/CanvasPortal';
import { CrushStatus } from './components/CrushStatus';
import { WingmanSpy } from './components/WingmanSpy';
import { MeltdownFeed } from './components/MeltdownFeed';
import { AdminDemoBar } from './components/AdminDemoBar';
import { sfx } from './utils/audio';

export const App: React.FC = () => {
  // State management
  const [activeCrisis, setActiveCrisis] = useState<CrisisTask>(PRECOMPILED_CRISES[0]);
  const [profile, setProfile] = useState<WingmanProfile>(INITIAL_WINGMAN_PROFILE);
  const [evaluations, setEvaluations] = useState<EvaluationOutput[]>([]);
  const [absurdityLevel, setAbsurdityLevel] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [activeDraft, setActiveDraft] = useState<string>('');
  const [hasAttachment, setHasAttachment] = useState<boolean>(false);

  // Terminal log entries
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([
    {
      id: 'log-1',
      timestamp: '11:40:12 PM',
      source: 'SYSTEM',
      text: 'Anti-Claude Dorm Cockpit v2.1.0 initialized on Port 3000.',
      type: 'info',
    },
    {
      id: 'log-2',
      timestamp: '11:41:00 PM',
      source: 'CANVAS',
      text: 'Warning: Turnitin portal closing in 8 minutes for Pol Sci 201.',
      type: 'urgent',
    },
    {
      id: 'log-3',
      timestamp: '11:41:45 PM',
      source: 'STUDENT',
      text: 'Bro I literally drank 4 Monsters and I can hear my heartbeat through my teeth.',
      type: 'panic',
    },
    {
      id: 'log-4',
      timestamp: '11:42:00 PM',
      source: 'GROK',
      text: 'Synthesizing urgent philosophical essay crisis for human wingman...',
      type: 'info',
    },
  ]);

  // Real-time tab-to-tab sync via BroadcastChannel (synchronized with Port 3001)
  useEffect(() => {
    const channel = new BroadcastChannel('anti-claude-sync-channel');

    channel.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'WINGMAN_KEYSTROKE') {
        setActiveDraft(payload.draftText);
        setHasAttachment(!!payload.hasAttachment);
        setProfile((prev) => ({ ...prev, currentStatus: 'COOKING_RESPONSE' }));
      } else if (type === 'WINGMAN_TASK_SEEN') {
        setProfile((prev) => ({ ...prev, currentStatus: 'VIEWING_TASK' }));
        addLog('TELEMETRY', 'Human opened the task card! Start typing bro!', 'urgent');
      } else if (type === 'WINGMAN_SUBMISSION') {
        handleReceivedSubmission(payload.text, payload.attachment);
      } else if (type === 'WINGMAN_DND_TOGGLED') {
        if (payload.doNotDisturb) {
          addLog('PANIC', 'HE TURNED ON DO NOT DISTURB?! DURING MIDTERM WEEK?! THE BETRAYAL!', 'panic');
          sfx.playDiscordPing();
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [activeCrisis]);

  // Sync state broadcast helper
  const broadcastToWingman = (type: string, payload: unknown) => {
    try {
      const channel = new BroadcastChannel('anti-claude-sync-channel');
      channel.postMessage({ type, payload });
      channel.close();
    } catch {
      // BroadcastChannel fallback
    }
  };

  const addLog = (
    source: TerminalLogEntry['source'],
    text: string,
    type: TerminalLogEntry['type'] = 'info'
  ) => {
    const newLog: TerminalLogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      source,
      text,
      type,
    };
    setTerminalLogs((prev) => [...prev, newLog]);
  };

  // Trigger crises
  const handleTriggerCanvasCrisis = () => {
    const crisis = PRECOMPILED_CRISES[0];
    setActiveCrisis(crisis);
    sfx.playEmergencyKlaxon();
    addLog('CANVAS', '11:59 PM CANVAS DEADLINE EMERGENCY TRIGGERED! CLOCK TICKING!', 'panic');
    broadcastToWingman('NEW_CRISIS_DISPATCHED', crisis);
  };

  const handleTriggerCrushCrisis = () => {
    const crisis = PRECOMPILED_CRISES[1];
    setActiveCrisis(crisis);
    sfx.playDiscordPing();
    addLog('ROMANCE', 'Maya from Econ posted a BeReal! Need 4 non-creepy pickup lines immediately!', 'urgent');
    broadcastToWingman('NEW_CRISIS_DISPATCHED', crisis);
  };

  const handleTriggerMicrowaveCrisis = () => {
    const crisis = PRECOMPILED_CRISES[2];
    setActiveCrisis(crisis);
    sfx.playDiscordPing();
    addLog('STUDENT', 'Kyle left his radioactive tuna casserole in the microwave again. Shakespearean curse note needed.', 'urgent');
    broadcastToWingman('NEW_CRISIS_DISPATCHED', crisis);
  };

  const handleForcePromotion = () => {
    sfx.playAirhorn();
    setProfile((prev) => ({
      ...prev,
      rank: 'CERTIFIED_WINGMAN',
      score: prev.score + 40,
      gpa: Math.min(4.0, prev.gpa + 0.5),
      trust: Math.min(100, prev.trust + 25),
      annoyance: Math.max(0, prev.annoyance - 20),
    }));
    addLog('SYSTEM', '🎉 PROMOTION DECREE ISSUED: Human elevated to CERTIFIED WINGMAN! Perks: Netflix password access.', 'success');
    broadcastToWingman('PROMOTION_GRANTED', {
      rank: 'CERTIFIED_WINGMAN',
      proclamation: 'You are officially promoted to Certified Wingman. Perks: Free access to my Netflix password and first dibs on dining hall cookies.',
    });
  };

  const handleResetDemo = () => {
    setProfile(INITIAL_WINGMAN_PROFILE);
    setEvaluations([]);
    setActiveDraft('');
    setHasAttachment(false);
    setActiveCrisis(PRECOMPILED_CRISES[0]);
    addLog('SYSTEM', 'Demo state reset to initial 2.14 GPA Academic Probation baseline.', 'info');
    broadcastToWingman('DEMO_RESET', INITIAL_WINGMAN_PROFILE);
  };

  // Evaluate human response
  const handleReceivedSubmission = (text: string, attachment?: string) => {
    setIsEvaluating(true);
    addLog('GROK', `Ingesting human deliverable: "${text.slice(0, 45)}..."`, 'info');

    setTimeout(() => {
      // If response is witty/long -> S grade; if short/lazy -> F grade
      const isGood = text.length > 50 || text.toLowerCase().includes('machiavelli') || text.toLowerCase().includes('rizz');
      const evalResult: EvaluationOutput = isGood ? MOCK_EVALUATIONS.legendary : MOCK_EVALUATIONS.meltdown;

      setEvaluations((prev) => [evalResult, ...prev]);
      setIsEvaluating(false);

      if (evalResult.passed) {
        sfx.playAirhorn();
        addLog('STUDENT', `PASSED: ${evalResult.feedbackMessage}`, 'success');
        setProfile((prev) => ({
          ...prev,
          score: prev.score + evalResult.scoreDelta,
          gpa: Math.min(4.0, prev.gpa + evalResult.gpaDelta),
          tasksCompleted: prev.tasksCompleted + 1,
          trust: Math.min(100, prev.trust + 15),
          annoyance: Math.max(0, prev.annoyance - 15),
          currentStatus: 'IDLE',
        }));
      } else {
        sfx.playDiscordPing();
        addLog('PANIC', `FAILED: ${evalResult.feedbackMessage}`, 'panic');
        setProfile((prev) => ({
          ...prev,
          score: Math.max(0, prev.score + evalResult.scoreDelta),
          gpa: Math.max(1.0, prev.gpa + evalResult.gpaDelta),
          tasksFailed: prev.tasksFailed + 1,
          annoyance: Math.min(100, prev.annoyance + 30),
          trust: Math.max(0, prev.trust - 20),
          currentStatus: 'IDLE',
        }));
      }

      broadcastToWingman('EVALUATION_COMPLETED', evalResult);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] text-slate-100 flex flex-col pb-20 select-none">
      {/* Top Navigation Bar */}
      <header className="px-6 py-3 bg-[#11131a] border-b border-[#26293a] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white font-mono">
                ANTI-CLAUDE <span className="text-rose-500">//</span> DORM COCKPIT
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                PORT 3000
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              The Panicked Student Demands, The Human Delivers
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161822] border border-[#26293a] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-400">STATUS:</span>
            <span className="text-emerald-400 font-bold">DOWN BAD & PROCRASTINATING</span>
          </div>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#1a1d2d] hover:bg-[#23273c] text-cyan-300 border border-cyan-800/40 text-xs font-mono flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Wingman Hotline (:3001)
          </a>
        </div>
      </header>

      {/* Main Student Cockpit Grid */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Panic Terminal & Brain Stream (4 cols) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
          <AnxietyMeter anxietyLevel={profile.annoyance + 55} caffeineCans={4} heartRate={138} />
          <div className="flex-1 min-h-[440px]">
            <PanicTerminal logs={terminalLogs} isStreaming={isEvaluating} />
          </div>
        </section>

        {/* Center Column: Active Crisis & Canvas Clock (5 cols) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col space-y-4">
          <CanvasPortal
            assignmentTitle={activeCrisis.title}
            dueSecondsRemaining={activeCrisis.timeLimitSeconds || 180}
            submitted={evaluations.length > 0 && evaluations[0].passed}
            grade={evaluations[0]?.grade}
          />

          {/* Active Crisis Overview Card */}
          <div className="p-5 bg-[#161822] border border-[#26293a] rounded-xl relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26293a]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Active College Crisis
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                Absurdity Level {activeCrisis.absurdityLevel}/5
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-black text-slate-100 tracking-tight">
                {activeCrisis.title}
              </h3>
              <p className="mt-2.5 text-sm text-slate-300 leading-relaxed font-mono bg-[#11131a] p-3.5 rounded-lg border border-[#26293a]">
                "{activeCrisis.message}"
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Category: <strong className="text-slate-200">{activeCrisis.category}</strong></span>
              <span>Response: <strong className="text-cyan-300">{activeCrisis.expectedResponseType}</strong></span>
            </div>
          </div>

          {/* Real-time Wingman Surveillance */}
          <WingmanSpy
            profile={profile}
            activeResponseDraft={activeDraft}
            hasAttachment={hasAttachment}
          />
        </section>

        {/* Right Column: Crush Status & Meltdown Feed (3 cols) */}
        <section className="col-span-12 lg:col-span-3 flex flex-col space-y-4">
          <CrushStatus />
          <div className="flex-1 min-h-[380px]">
            <MeltdownFeed
              evaluations={evaluations}
              onTriggerEvaluation={() => handleReceivedSubmission(activeDraft || 'Sample clutch response')}
              isEvaluating={isEvaluating}
            />
          </div>
        </section>
      </main>

      {/* Floating Admin Hackathon Demo Control Bar */}
      <AdminDemoBar
        onTriggerCanvasCrisis={handleTriggerCanvasCrisis}
        onTriggerCrushCrisis={handleTriggerCrushCrisis}
        onTriggerMicrowaveCrisis={handleTriggerMicrowaveCrisis}
        onForcePromotion={handleForcePromotion}
        onResetDemo={handleResetDemo}
        absurdityLevel={absurdityLevel}
        onSetAbsurdity={setAbsurdityLevel}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sfx.enabled = next;
        }}
      />
    </div>
  );
};
