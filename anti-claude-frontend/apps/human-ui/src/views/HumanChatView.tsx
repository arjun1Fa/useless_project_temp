import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  Clock,
  ChevronDown,
  History,
  MessageSquare,
  Sparkles,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CrisisTask, WingmanProfile } from '@anti-claude/shared-types';
import { api, broadcastSync, socket } from '../utils/socket';
import { humanSfx } from '../utils/audio';

export interface ChatMessage {
  id: string;
  senderType: 'AI' | 'HUMAN';
  content: string;
  taskId?: string | null;
  createdAt: string;
  metadata?: Record<string, any> | null;
  attachments?: Array<{ id?: string; fileUrl?: string; fileName?: string }>;
  isTaskDirective?: boolean;
  taskData?: {
    id: string;
    title: string;
    priority: string;
    absurdityLevel: number;
    isEmergency: boolean;
  };
}

interface HumanChatViewProps {
  activeCrisis: CrisisTask;
  profile: WingmanProfile;
  onNavigateToDashboard: () => void;
  onDraftChange: (text: string, hasAttachment: boolean) => void;
  onSubmitResponse: (text: string, attachment?: string) => void;
  isSubmitting?: boolean;
}

export const HumanChatView: React.FC<HumanChatViewProps> = ({
  activeCrisis,
  profile,
  onNavigateToDashboard,
  onDraftChange,
  onSubmitResponse,
  isSubmitting = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Load message history from backend on mount
  const loadMessages = async () => {
    try {
      const res = await api.getMessages();
      if (res?.success && Array.isArray(res.data)) {
        // Backend returns in desc order (newest first); reverse for chat timeline
        const chronological = [...res.data].reverse().map((m: any) => {
          let cleanContent = m.content;
          let parsedMeta = m.metadata;
          // Check if content is a stringified JSON announcement
          if (typeof cleanContent === 'string' && cleanContent.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(cleanContent);
              cleanContent = parsed.announcement || parsed.message || cleanContent;
            } catch {}
          }
          return {
            id: m.id,
            senderType: m.senderType,
            content: cleanContent,
            taskId: m.taskId,
            createdAt: m.createdAt,
            metadata: parsedMeta,
            attachments: m.attachments || [],
          } as ChatMessage;
        });
        setMessages(chronological);
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  // Load all tasks for the history view
  const loadTasks = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getTasks();
      if (res?.success && Array.isArray(res.data)) {
        setAllTasks(res.data);
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadMessages();
    loadTasks();
  }, []);

  // Listen to live incoming messages & tasks from Socket.IO
  useEffect(() => {
    const onAiMessage = (event: any) => {
      const d = event?.data;
      if (d) {
        let content = d.content;
        if (typeof content === 'string' && content.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(content);
            content = parsed.announcement || parsed.message || content;
          } catch {}
        }
        const newMsg: ChatMessage = {
          id: d.id || `ai-${Date.now()}`,
          senderType: 'AI',
          content,
          taskId: d.taskId,
          createdAt: d.createdAt || new Date().toISOString(),
          metadata: d.metadata,
        };
        setMessages((prev) => {
          // Prevent duplicates by ID or identical content & senderType
          if (prev.some((m) => m.id === newMsg.id || (m.content === newMsg.content && m.senderType === 'AI'))) return prev;
          return [...prev, newMsg];
        });
        if (soundEnabled) {
          if (newMsg.metadata?.type === 'EVALUATION_REACTION') {
            humanSfx.playPromotionAirhorn();
          } else {
            humanSfx.playIncomingPing();
          }
        }
      }
    };

    const onHumanMessage = (event: any) => {
      const d = event?.data;
      if (d) {
        const newMsg: ChatMessage = {
          id: d.id || `human-${Date.now()}`,
          senderType: 'HUMAN',
          content: d.content,
          taskId: d.taskId,
          createdAt: d.createdAt || new Date().toISOString(),
          metadata: d.metadata,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id || (m.content === newMsg.content && m.senderType === 'HUMAN'))) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    };

    const onTaskCreated = (event: any) => {
      const t = event?.data;
      if (t) {
        // Task state & crisis banner updated; prompt message bubble is delivered cleanly via AI_MESSAGE_CREATED
        loadTasks();
        if (soundEnabled) {
          if (t.isEmergency) humanSfx.playKlaxon();
          else humanSfx.playIncomingPing();
        }
      }
    };

    const onTaskCompleted = (event: any) => {
      loadMessages();
      loadTasks();
    };

    const onPromoted = (event: any) => {
      const p = event?.data;
      if (p) {
        const promoMsg: ChatMessage = {
          id: `promo-${Date.now()}`,
          senderType: 'AI',
          content: p.aiMessage || `Management decree: Elevated to ${p.newRank}.`,
          createdAt: new Date().toISOString(),
          metadata: { type: 'PROMOTION_ANNOUNCEMENT', newRank: p.newRank },
        };
        setMessages((prev) => [...prev, promoMsg]);
        if (soundEnabled) humanSfx.playPromotionAirhorn();
      }
    };

    const onMessagesCleared = () => {
      setMessages([]);
    };

    socket.on('AI_MESSAGE_CREATED', onAiMessage);
    socket.on('AI_MESSAGE_SENT', onAiMessage);
    socket.on('HUMAN_MESSAGE_CREATED', onHumanMessage);
    socket.on('TASK_CREATED', onTaskCreated);
    socket.on('TASK_COMPLETED', onTaskCompleted);
    socket.on('EMPLOYEE_PROMOTED', onPromoted);
    socket.on('MESSAGES_CLEARED', onMessagesCleared);

    return () => {
      socket.off('AI_MESSAGE_CREATED', onAiMessage);
      socket.off('AI_MESSAGE_SENT', onAiMessage);
      socket.off('HUMAN_MESSAGE_CREATED', onHumanMessage);
      socket.off('TASK_CREATED', onTaskCreated);
      socket.off('TASK_COMPLETED', onTaskCompleted);
      socket.off('EMPLOYEE_PROMOTED', onPromoted);
      socket.off('MESSAGES_CLEARED', onMessagesCleared);
    };
  }, [soundEnabled]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
    onDraftChange(inputText, false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && !attachment) return;

    // Immediately create an optimistic Human message in chat
    const humanMsg: ChatMessage = {
      id: `human-${Date.now()}`,
      senderType: 'HUMAN',
      content: textToSend,
      taskId: activeCrisis.id,
      createdAt: new Date().toISOString(),
      attachments: attachment ? [{ fileName: attachmentName, fileUrl: attachment }] : [],
    };
    setMessages((prev) => [...prev, humanMsg]);

    // Send to backend and broadcast
    onSubmitResponse(textToSend, attachment || undefined);

    // Reset input fields
    setInputText('');
    setAttachment(null);
    setAttachmentName('');
    onDraftChange('', false);
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative w-full max-w-[430px] h-[860px] bg-[#09090b] text-[#e5e1e4] flex flex-col justify-between border border-neutral-800 shadow-[0_0_80px_rgba(255,85,0,0.2)] rounded-[44px] mx-auto overflow-hidden">
      {/* ─── Top App Header ─── */}
      <header className="px-5 pt-4 pb-3 bg-[#111114]/90 backdrop-blur-xl border-b border-neutral-800/80 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5500] to-amber-500 flex items-center justify-center text-black font-black font-mono shadow-[0_0_15px_rgba(255,85,0,0.4)]">
              AC
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09090b]"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-white tracking-tight">Anti-Claude</h1>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 uppercase">
                Boss
              </span>
            </div>
            <p className="text-[11px] font-mono text-neutral-400">
              Rank: <span className="text-amber-300 font-bold">{profile.rank}</span> • Score: {profile.score}
            </p>
          </div>
        </div>

        {/* Tab & Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white bg-white/5 border border-white/10"
            title="Toggle SFX"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#ff5500]" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
          </button>

          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-2.5 py-1 rounded-full text-[11px] font-mono text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* ─── Navigation Tabs: Live Chat vs Task History ─── */}
      <div className="px-5 py-2 bg-[#0d0d10] border-b border-neutral-900 flex items-center gap-2 text-xs font-mono shrink-0 z-10">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
            activeTab === 'chat'
              ? 'bg-[#ff5500] text-black font-bold shadow-[0_0_12px_rgba(255,85,0,0.4)]'
              : 'text-neutral-400 hover:text-white bg-neutral-900/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Chat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            loadTasks();
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
            activeTab === 'history'
              ? 'bg-[#ff5500] text-black font-bold shadow-[0_0_12px_rgba(255,85,0,0.4)]'
              : 'text-neutral-400 hover:text-white bg-neutral-900/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Task History ({allTasks.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: LIVE CHAT STREAM ─── */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 font-label scroll-smooth">
          {/* Welcome Banner */}
          <div className="text-center py-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 bg-neutral-900/80 px-3 py-1 rounded-full border border-neutral-800">
              Connected to Anti-Claude (Student) • Human-AI Inference Active
            </span>
          </div>

          {/* Active Directive Reminder Chip */}
          {activeCrisis && (
            <div className="p-3 rounded-2xl bg-[#141418] border border-[#ff5500]/30 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-[#ff5500] uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3" /> URGENT STUDENT PROMPT
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Chaos {activeCrisis.absurdityLevel}/5
                </span>
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight">{activeCrisis.title}</h4>
              <p className="text-[11px] text-neutral-300 mt-1 font-mono line-clamp-2">
                "{activeCrisis.message}"
              </p>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => {
            const isAI = msg.senderType === 'AI';
            const isPromotion = msg.metadata?.type === 'PROMOTION_ANNOUNCEMENT';
            const isReaction = msg.metadata?.type === 'EVALUATION_REACTION';

            // Special Card: Promotion Announcement
            if (isPromotion) {
              return (
                <div key={msg.id} className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/40 shadow-lg text-center my-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center mb-1.5 border border-amber-500/40">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                    CAMPUS WINGMAN LEVEL-UP DECREE
                  </span>
                  <p className="text-xs text-neutral-200 mt-2 font-mono leading-relaxed">
                    {msg.content}
                  </p>
                  <span className="text-[9px] text-neutral-500 font-mono mt-2 block">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
              >
                {/* Sender label */}
                <span className="text-[10px] font-mono text-neutral-500 mb-1 px-1">
                  {isAI ? 'Anti-Claude (Student)' : 'You (Human AI / Chatbot)'} • {formatTime(msg.createdAt)}
                </span>

                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-mono leading-relaxed shadow-md ${
                    isAI
                      ? isReaction
                        ? 'bg-[#151722] text-slate-100 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                        : 'bg-[#17181f] text-neutral-200 border border-neutral-800'
                      : 'bg-gradient-to-tr from-[#ff5500] to-orange-500 text-black font-semibold rounded-br-none shadow-[0_0_20px_rgba(255,85,0,0.25)]'
                  }`}
                >
                  {/* Reaction Verdict Badge */}
                  {isAI && isReaction && (
                    <div className="flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-cyan-900/50 text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>STUDENT RATING: {msg.metadata?.verdict || 'REVIEWED'}</span>
                      </div>
                      {msg.metadata?.score !== undefined && (
                        <div className="flex items-center gap-1 text-[9px]">
                          <span className="text-slate-400">{msg.metadata.score}/100</span>
                          {msg.metadata?.scoreDelta !== undefined && (
                            <span className={msg.metadata.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              ({msg.metadata.scoreDelta >= 0 ? `+${msg.metadata.scoreDelta}` : msg.metadata.scoreDelta} pts)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attachment in Human Message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2">
                      {msg.attachments[0].fileUrl?.startsWith('data:image') ? (
                        <img
                          src={msg.attachments[0].fileUrl}
                          alt="attached deliverable"
                          className="w-40 h-28 object-cover rounded-lg border border-black/20"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 p-1.5 rounded bg-black/20 text-[10px]">
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate">{msg.attachments[0].fileName || 'attachment'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {/* Evaluating / typing indicator */}
          {isSubmitting && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#ff5500] bg-[#1a1714] p-3 rounded-2xl border border-[#ff5500]/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#ff5500] animate-ping"></span>
              <span>Anti-Claude is typing a reply...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ─── TAB 2: TASK HISTORY VIEW ─── */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Historical Task Directives & Grades
            </span>
            <span className="text-[11px] text-amber-300 font-bold">
              {allTasks.filter((t) => t.status === 'COMPLETED').length} Completed
            </span>
          </div>

          {isLoadingHistory && (
            <div className="text-center py-8 text-xs text-neutral-500">
              Loading full audit log from Supabase...
            </div>
          )}

          {!isLoadingHistory && allTasks.length === 0 && (
            <div className="text-center py-12 text-xs text-neutral-500">
              No previous assignments recorded yet.
            </div>
          )}

          {allTasks.map((t, index) => {
            const isCompleted = t.status === 'COMPLETED';
            const evalRecord = t.evaluation;

            return (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-[#121318] border border-neutral-800 hover:border-neutral-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-bold">
                    #{index + 1} • {t.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isCompleted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white tracking-tight">{t.title}</h4>
                <p className="text-[11px] text-neutral-300 font-mono line-clamp-2">
                  {t.description}
                </p>

                {/* Evaluation Card if Completed */}
                {evalRecord && (
                  <div className="p-2 rounded-xl bg-black/40 border border-cyan-900/30 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span>VERDICT: {evalRecord.verdict}</span>
                      <span>SCORE: {evalRecord.score}/100</span>
                    </div>
                    <p className="text-neutral-300 italic">"{evalRecord.feedback}"</p>
                  </div>
                )}

                <div className="text-[9px] text-neutral-500 flex items-center justify-between pt-1 border-t border-white/5">
                  <span>Priority: {t.priority}</span>
                  <span>Absurdity: Level {t.absurdityLevel}/5</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Attachment Preview Bar ─── */}
      {attachment && (
        <div className="px-4 py-2 bg-[#121216] border-t border-neutral-800 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 truncate">
            <img src={attachment} alt="attachment" className="w-8 h-8 rounded object-cover border border-white/10" />
            <span className="truncate text-neutral-300 text-[11px]">{attachmentName}</span>
          </div>
          <button onClick={removeAttachment} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Bottom Chat Response Input Bar ─── */}
      <footer className="p-3 bg-[#111114]/95 border-t border-neutral-800 shrink-0 z-20">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File Input */}
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
            className="p-2.5 rounded-full text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 shrink-0 transition active:scale-95"
            title="Attach image deliverable"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Text Input - NEVER disabled so live continuous conversation flows */}
          <input
            type="text"
            value={inputText}
            onChange={handleTextChange}
            placeholder="Generate your AI advice to the student..."
            className="flex-1 bg-neutral-900/80 border border-neutral-800 focus:border-[#ff5500] rounded-full px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !attachment}
            className="w-10 h-10 rounded-full bg-[#ff5500] hover:bg-[#ff6611] disabled:opacity-40 text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,85,0,0.5)] active:scale-95 transition shrink-0"
            title="Send AI advice to student"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </form>
      </footer>
    </div>
  );
};
