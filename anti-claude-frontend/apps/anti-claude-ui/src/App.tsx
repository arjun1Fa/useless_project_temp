import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Sparkles,
  Zap,
  ExternalLink,
  Award,
  RotateCcw,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  User,
  Bot,
  CheckCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { WingmanProfile, INITIAL_WINGMAN_PROFILE } from '@anti-claude/shared-types';
import { socket, broadcastSync, api } from './utils/socket';
import { sfx } from './utils/audio';

interface ConversationMessage {
  id: string;
  senderType: 'AI' | 'HUMAN';
  content: string;
  taskId?: string | null;
  createdAt: string;
  metadata?: Record<string, any> | null;
}

export const App: React.FC = () => {
  // ─── State ───
  const [activeTask, setActiveTask] = useState<any>(null);
  const [profile, setProfile] = useState<WingmanProfile>(INITIAL_WINGMAN_PROFILE);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeDraft, setActiveDraft] = useState<string>('');
  const [humanStatus, setHumanStatus] = useState<string>('IDLE');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Initial Load from Backend ───
  const loadData = async () => {
    try {
      const [profRes, tasksRes, msgRes] = await Promise.all([
        api.getProfile(),
        api.getTasks(),
        api.getMessages(),
      ]);

      if (profRes?.success && profRes.data) {
        setProfile((prev) => ({
          ...prev,
          rank: profRes.data.rank || prev.rank,
          score: profRes.data.score ?? prev.score,
          tasksCompleted: profRes.data.tasksCompleted ?? prev.tasksCompleted,
          trust: profRes.data.relationshipState?.trust ?? prev.trust,
          annoyance: profRes.data.relationshipState?.annoyance ?? prev.annoyance,
        }));
      }

      if (tasksRes?.success && tasksRes.data?.length > 0) {
        setActiveTask(tasksRes.data[0]);
      }

      if (msgRes?.success && Array.isArray(msgRes.data)) {
        // Chronological order (oldest to newest)
        const sorted = [...msgRes.data].reverse().map((m: any) => {
          let content = m.content;
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            try {
              const p = JSON.parse(content);
              content = p.announcement || p.message || content;
            } catch {}
          }
          return {
            id: m.id,
            senderType: m.senderType,
            content,
            taskId: m.taskId,
            createdAt: m.createdAt,
            metadata: m.metadata,
          };
        });
        setMessages(sorted);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Realtime Socket.IO & Telemetry ───
  useEffect(() => {
    // 1. Phone-to-Phone live keystroke & viewing telemetry
    const onSyncMessage = (data: { type: string; payload: any }) => {
      const { type, payload } = data;
      if (type === 'WINGMAN_KEYSTROKE') {
        setActiveDraft(payload.draftText || '');
        setHumanStatus(payload.draftText ? 'COOKING_RESPONSE' : 'READING_DIRECTIVE');
      } else if (type === 'WINGMAN_TASK_SEEN') {
        setHumanStatus('VIEWING_TASK');
      } else if (type === 'WINGMAN_SUBMISSION') {
        setHumanStatus('SUBMITTED_DELIVERABLE');
        setActiveDraft('');
      }
    };
    socket.on('sync_message', onSyncMessage);

    // 2. Real backend event listeners
    const onTaskCreated = (event: any) => {
      const t = event?.data;
      if (t) {
        setIsGenerating(false);
        setActiveTask(t);
        setHumanStatus('ASSIGNED_WAITING_FOR_HUMAN');
        setActiveDraft('');
        if (soundEnabled) sfx.playEmergencyKlaxon();
        loadData();
      }
    };
    socket.on('TASK_CREATED', onTaskCreated);

    const onAiMessage = (event: any) => {
      const m = event?.data;
      if (m) {
        let content = m.content;
        if (typeof content === 'string' && content.trim().startsWith('{')) {
          try {
            const p = JSON.parse(content);
            content = p.announcement || p.message || content;
          } catch {}
        }
        const newMsg: ConversationMessage = {
          id: m.id || `msg-${Date.now()}`,
          senderType: m.senderType || 'AI',
          content,
          taskId: m.taskId,
          createdAt: m.createdAt || new Date().toISOString(),
          metadata: m.metadata,
        };
        setMessages((prev) => {
          if (prev.some((item) => item.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };
    socket.on('AI_MESSAGE_CREATED', onAiMessage);
    socket.on('AI_MESSAGE_SENT', onAiMessage);

    const onTaskCompleted = (event: any) => {
      setHumanStatus('EVALUATED');
      if (soundEnabled) sfx.playAirhorn();
      loadData();
    };
    socket.on('TASK_COMPLETED', onTaskCompleted);

    const onPromoted = (event: any) => {
      const p = event?.data;
      if (p) {
        setProfile((prev) => ({ ...prev, rank: p.newRank }));
        if (soundEnabled) sfx.playAirhorn();
        loadData();
      }
    };
    socket.on('EMPLOYEE_PROMOTED', onPromoted);

    return () => {
      socket.off('sync_message', onSyncMessage);
      socket.off('TASK_CREATED', onTaskCreated);
      socket.off('AI_MESSAGE_CREATED', onAiMessage);
      socket.off('AI_MESSAGE_SENT', onAiMessage);
      socket.off('TASK_COMPLETED', onTaskCompleted);
      socket.off('EMPLOYEE_PROMOTED', onPromoted);
    };
  }, [soundEnabled]);

  // ─── THE SINGLE TRIGGER BUTTON ───
  // Generates a live, dynamic, realistic, slightly absurd assignment using Gemini on backend
  const handleTriggerRandomWork = async () => {
    setIsGenerating(true);
    if (soundEnabled) sfx.playDiscordPing();

    try {
      const res = await api.triggerTask('HIGH');
      if (res?.success && res.data) {
        setActiveTask(res.data);
      }
    } catch (e) {
      console.error('Trigger task failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleForcePromotion = async () => {
    if (soundEnabled) sfx.playAirhorn();
    try {
      await api.promote();
      loadData();
    } catch {}
  };

  const handleResetDemo = async () => {
    try {
      await api.reset();
      setActiveDraft('');
      setActiveTask(null);
      setHumanStatus('IDLE');
      loadData();
    } catch {}
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-mono select-none">
      {/* ─── Top Control Header ─── */}
      <header className="px-6 py-3.5 bg-[#0f1117] border-b border-[#202330] flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-[#ff5500] flex items-center justify-center shadow-lg shadow-rose-600/30 text-white font-black">
            AC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white">
                ANTI-CLAUDE <span className="text-[#ff5500]">//</span> AI BOSS COCKPIT
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                AI EMPLOYER ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous Management Engine • Human Employee Connected
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-[#161822] text-slate-400 hover:text-white border border-[#26293a]"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ff5500]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#1a1d2d] hover:bg-[#23273c] text-cyan-300 border border-cyan-800/40 text-xs flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Human Phone Screen (:3001)
          </a>
        </div>
      </header>

      {/* ─── Main Cockpit Body ─── */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-7xl mx-auto w-full overflow-hidden">
        {/* ─── LEFT PANEL: THE SINGLE TRIGGER BUTTON & DIRECTIVE STATUS (5 cols) ─── */}
        <section className="col-span-12 lg:col-span-5 flex flex-col space-y-5">
          {/* THE SINGLE TRIGGER BUTTON */}
          <div className="p-6 bg-[#11131a] border-2 border-[#ff5500]/40 rounded-2xl shadow-[0_0_30px_rgba(255,85,0,0.15)] flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-[#ff5500] uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Management Directive Generator
            </span>
            <h2 className="text-base font-black text-white mb-2">
              Assign Work to Human Employee
            </h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Click below to trigger Anti-Claude AI. It will generate a dynamic, witty, in-character corporate assignment and dispatch it to the human's phone immediately.
            </p>

            <button
              onClick={handleTriggerRandomWork}
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#ff5500] via-orange-500 to-amber-500 hover:from-[#ff6611] hover:to-amber-400 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,85,0,0.4)] disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                  <span>Anti-Claude is Formulating Directive...</span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 fill-current" />
                  <span>⚡ Assign Random Work to Human</span>
                </>
              )}
            </button>
          </div>

          {/* ACTIVE DIRECTIVE CARD */}
          <div className="p-5 bg-[#12141c] border border-[#232738] rounded-2xl shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#232738] mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ff5500]" /> Active Task Dispatched
              </span>
              {activeTask && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 uppercase">
                  Tier {activeTask.absurdityLevel || 1}/5
                </span>
              )}
            </div>

            {activeTask ? (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">{activeTask.title}</h3>
                  <p className="mt-2 text-xs text-slate-300 bg-[#0c0d12] p-3 rounded-xl border border-[#202330] leading-relaxed">
                    "{activeTask.aiMessage || activeTask.description}"
                  </p>
                </div>

                {/* Human Live Status Indicator */}
                <div className="p-3 rounded-xl bg-[#0e1017] border border-[#202330] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Employee Telemetry:</span>
                    <span className="font-bold text-[#ff5500] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ff5500] animate-ping"></span>
                      {humanStatus}
                    </span>
                  </div>

                  {/* Keystroke Mirror (Shows what human is typing in real time) */}
                  {activeDraft ? (
                    <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-200">
                      <span className="text-[10px] text-amber-500 block font-bold mb-0.5">
                        HUMAN LIVE KEYSTROKE FEED:
                      </span>
                      "{activeDraft}"
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Awaiting human employee response on Phone 2...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
                <span>No active task dispatched yet.</span>
                <span className="mt-1 text-[11px]">Click the button above to assign work!</span>
              </div>
            )}
          </div>

          {/* Quick Boss Management Controls */}
          <div className="p-4 bg-[#11131a] border border-[#202330] rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Rank: <strong className="text-amber-300">{profile.rank}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Score: <strong className="text-white">{profile.score}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleForcePromotion}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold transition flex items-center gap-1"
                title="Force promote employee"
              >
                <Award className="w-3.5 h-3.5" />
                Promote
              </button>

              <button
                onClick={handleResetDemo}
                className="p-1.5 rounded-lg bg-[#161822] hover:bg-[#202330] text-slate-400 hover:text-white border border-[#26293a] transition"
                title="Reset Employee State"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── RIGHT PANEL: LIVE DIALOGUE & CONVERSATION STREAM (7 cols) ─── */}
        <section className="col-span-12 lg:col-span-7 flex flex-col bg-[#0f1118] border border-[#202330] rounded-2xl shadow-xl overflow-hidden h-[740px]">
          {/* Stream Header */}
          <div className="px-5 py-3.5 bg-[#141620] border-b border-[#202330] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#ff5500]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Boss-Employee Dialogue Feed
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {messages.length} Messages Recorded
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {messages.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                No dialogue history recorded yet. Click "Assign Random Work" to start!
              </div>
            )}

            {messages.map((m) => {
              const isAI = m.senderType === 'AI';
              const isPromotion = m.metadata?.type === 'PROMOTION_ANNOUNCEMENT';
              const isReaction = m.metadata?.type === 'EVALUATION_REACTION';

              if (isPromotion) {
                return (
                  <div key={m.id} className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/40 shadow-lg text-center my-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5" /> OFFICIAL PROMOTION DECREE
                    </span>
                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{m.content}</p>
                    <span className="text-[9px] text-slate-500 mt-1 block">{formatTime(m.createdAt)}</span>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
                  {/* Sender Name */}
                  <span className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1">
                    {isAI ? (
                      <>
                        <Bot className="w-3 h-3 text-[#ff5500]" />
                        <span className="text-[#ff5500] font-bold">Anti-Claude (Boss)</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-400 font-bold">Human Employee</span>
                      </>
                    )}{' '}
                    • {formatTime(m.createdAt)}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-md ${
                      isAI
                        ? isReaction
                          ? 'bg-[#151722] text-slate-100 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                          : 'bg-[#181a24] text-slate-200 border border-[#282b3c]'
                        : 'bg-gradient-to-tr from-[#ff5500] to-orange-500 text-black font-semibold rounded-br-none shadow-[0_0_15px_rgba(255,85,0,0.2)]'
                    }`}
                  >
                    {isAI && isReaction && (
                      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-cyan-900/50 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        EVALUATION VERDICT: {m.metadata?.verdict || 'RECORDED'}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              );
            })}

            <div ref={chatEndRef} />
          </div>
        </section>
      </main>
    </div>
  );
};
