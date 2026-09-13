import React, { useState, useEffect } from 'react';
import {
  CrisisTask,
  EvaluationOutput,
  WingmanProfile,
  INITIAL_WINGMAN_PROFILE,
  INITIAL_MEMORIES,
  PRECOMPILED_CRISES,
} from '@anti-claude/shared-types';
import { VoiceActuatorHome } from './views/VoiceActuatorHome';
import { ActuatorDashboard } from './views/ActuatorDashboard';
import { HumanChatView } from './views/HumanChatView';
import { EmergencyHUD } from './components/EmergencyHUD';
import { PromotionModal } from './components/PromotionModal';
import { humanSfx } from './utils/audio';

import { socket, broadcastSync, api } from './utils/socket';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'home' | 'dashboard'>('chat');
  const [activeCrisis, setActiveCrisis] = useState<CrisisTask>(PRECOMPILED_CRISES[0]);
  const [profile, setProfile] = useState<WingmanProfile>(INITIAL_WINGMAN_PROFILE);
  const [evaluations, setEvaluations] = useState<EvaluationOutput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promotion modal state
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotedRank, setPromotedRank] = useState<WingmanProfile['rank']>('CERTIFIED_WINGMAN');
  const [proclamationText, setProclamationText] = useState('');

  // Initial load from backend API
  useEffect(() => {
    api.getProfile().then((res) => {
      if (res?.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          rank: (res.data.rank as any) || prev.rank,
          score: res.data.score ?? prev.score,
          tasksCompleted: res.data.tasksCompleted ?? prev.tasksCompleted,
          tasksFailed: res.data.tasksFailed ?? prev.tasksFailed,
          trust: res.data.relationshipState?.trust ?? prev.trust,
          annoyance: res.data.relationshipState?.annoyance ?? prev.annoyance,
        }));
      }
    }).catch(() => {});

    api.getTasks().then((res) => {
      if (res?.success && res.data && res.data.length > 0) {
        const latest = res.data[0];
        if (latest.status === 'DELIVERED' || latest.status === 'PENDING') {
          setActiveCrisis((prev) => ({
            ...prev,
            id: latest.id,
            title: latest.title,
            message: latest.messages?.[0]?.content || latest.description,
            absurdityLevel: latest.absurdityLevel,
            isEmergency: latest.isEmergency,
          }));
        }
      }
    }).catch(() => {});
  }, []);

  // Sync with Anti-Claude UI via BroadcastChannel (same device) and Socket.IO (across phones)
  useEffect(() => {
    const handleIncomingSync = (type: string, payload: any) => {
      if (type === 'NEW_CRISIS_DISPATCHED') {
        setActiveCrisis(payload);
        if (payload.isEmergency) {
          humanSfx.playKlaxon();
        } else {
          humanSfx.playIncomingPing();
        }
      } else if (type === 'EVALUATION_COMPLETED') {
        const evalItem: EvaluationOutput = payload;
        setEvaluations((prev) => [evalItem, ...prev]);
        setIsSubmitting(false);

        if (evalItem.passed) {
          humanSfx.playPromotionAirhorn();
          setProfile((prev) => ({
            ...prev,
            score: prev.score + evalItem.scoreDelta,
            gpa: Math.min(4.0, prev.gpa + evalItem.gpaDelta),
            tasksCompleted: prev.tasksCompleted + 1,
            trust: Math.min(100, prev.trust + 15),
            annoyance: Math.max(0, prev.annoyance - 15),
          }));
        } else {
          humanSfx.playIncomingPing();
          setProfile((prev) => ({
            ...prev,
            score: Math.max(0, prev.score + evalItem.scoreDelta),
            gpa: Math.max(1.0, prev.gpa + evalItem.gpaDelta),
            tasksFailed: prev.tasksFailed + 1,
            annoyance: Math.min(100, prev.annoyance + 25),
            trust: Math.max(0, prev.trust - 15),
          }));
        }
      } else if (type === 'PROMOTION_GRANTED') {
        setPromotedRank(payload.rank);
        setProclamationText(payload.proclamation);
        setPromotionModalOpen(true);
        humanSfx.playPromotionAirhorn();
        setProfile((prev) => ({
          ...prev,
          rank: payload.rank,
          score: prev.score + 40,
        }));
      } else if (type === 'DEMO_RESET') {
        setProfile(INITIAL_WINGMAN_PROFILE);
        setEvaluations([]);
        setActiveCrisis(PRECOMPILED_CRISES[0]);
      }
    };

    // 1. BroadcastChannel (for same browser)
    const channel = new BroadcastChannel('anti-claude-sync-channel');
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      handleIncomingSync(type, payload);
    };

    // 2. Socket.IO relay (across phones)
    const onSocketSync = (data: { type: string; payload: any }) => {
      handleIncomingSync(data.type, data.payload);
    };
    socket.on('sync_message', onSocketSync);

    // 3. Backend live event listeners
    const onBackendTask = (event: any) => {
      const t = event?.data;
      if (t) {
        setActiveCrisis((prev) => ({
          ...prev,
          id: t.id || t.taskId || prev.id,
          title: t.title || prev.title,
          message: t.aiMessage || t.description || prev.message,
          isEmergency: !!t.isEmergency,
        }));
        if (t.isEmergency) {
          humanSfx.playKlaxon();
        } else {
          humanSfx.playIncomingPing();
        }
      }
    };
    socket.on('TASK_CREATED', onBackendTask);

    const onBackendAiMessage = () => {
      setIsSubmitting(false);
    };
    socket.on('AI_MESSAGE_CREATED', onBackendAiMessage);
    socket.on('AI_MESSAGE_SENT', onBackendAiMessage);

    const onBackendEvaluation = (event: any) => {
      const d = event?.data;
      if (d) {
        setIsSubmitting(false);
        humanSfx.playPromotionAirhorn();
        setProfile((prev) => ({
          ...prev,
          score: prev.score + (d.score || 10),
          tasksCompleted: prev.tasksCompleted + 1,
        }));
        setActiveCrisis((prev) => ({
          ...prev,
          status: 'EVALUATED',
          isEmergency: false,
        }));
      }
    };
    socket.on('TASK_COMPLETED', onBackendEvaluation);

    const onBackendPromotion = (event: any) => {
      const p = event?.data;
      if (p) {
        setPromotedRank(p.newRank);
        setProclamationText(p.aiMessage || 'You have been promoted by Management.');
        setPromotionModalOpen(true);
        humanSfx.playPromotionAirhorn();
      }
    };
    socket.on('EMPLOYEE_PROMOTED', onBackendPromotion);

    // Notify Anti-Claude that the human opened the hotline
    broadcastSync('WINGMAN_TASK_SEEN', { taskId: activeCrisis.id });
    api.markSeen(activeCrisis.id);

    return () => {
      channel.close();
      socket.off('sync_message', onSocketSync);
      socket.off('TASK_CREATED', onBackendTask);
      socket.off('TASK_COMPLETED', onBackendEvaluation);
      socket.off('AI_MESSAGE_CREATED', onBackendAiMessage);
      socket.off('AI_MESSAGE_SENT', onBackendAiMessage);
      socket.off('EMPLOYEE_PROMOTED', onBackendPromotion);
    };
  }, [activeCrisis.id]);

  // Safety watchdog: ensure isSubmitting never locks permanently
  useEffect(() => {
    if (isSubmitting) {
      const timer = setTimeout(() => {
        setIsSubmitting(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  const handleDraftChange = (draftText: string, hasAttachment: boolean) => {
    broadcastSync('WINGMAN_KEYSTROKE', { draftText, hasAttachment });
  };

  const handleSubmitResponse = async (text: string, attachment?: string) => {
    setIsSubmitting(true);
    // 1. Broadcast to Boss Cockpit
    broadcastSync('WINGMAN_SUBMISSION', { text, attachment });
    // 2. Submit to backend API (only pass active taskId if not already evaluated/closed)
    try {
      const isTaskActive = activeCrisis && activeCrisis.status !== 'EVALUATED' && activeCrisis.status !== 'CLOSED';
      const targetTaskId = isTaskActive ? activeCrisis.id : undefined;
      await api.sendMessage(text, targetTaskId);
    } catch (err) {
      console.error('Submit response failed:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e5e1e4] flex flex-col justify-center items-center py-6 px-2">
      {/* Emergency Red Flashing Perimeter */}
      <EmergencyHUD active={activeCrisis.isEmergency} reason={activeCrisis.emergencyReason} />

      {/* Promotion Certificate Modal */}
      <PromotionModal
        open={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        newRank={promotedRank}
        proclamationText={proclamationText}
      />

      {/* Active View: Realtime Chat, Home Voice Actuator OR Minimal Dashboard */}
      {currentView === 'chat' && (
        <HumanChatView
          activeCrisis={activeCrisis}
          profile={profile}
          onNavigateToDashboard={() => setCurrentView('dashboard')}
          onDraftChange={handleDraftChange}
          onSubmitResponse={handleSubmitResponse}
          isSubmitting={isSubmitting}
        />
      )}

      {currentView === 'home' && (
        <VoiceActuatorHome
          activeCrisis={activeCrisis}
          onSubmitResponse={handleSubmitResponse}
          onNavigateToDashboard={() => setCurrentView('dashboard')}
          onDraftChange={handleDraftChange}
          isSubmitting={isSubmitting}
        />
      )}

      {currentView === 'dashboard' && (
        <ActuatorDashboard
          profile={profile}
          activeCrisis={activeCrisis}
          evaluations={evaluations}
          onNavigateToHome={() => setCurrentView('chat')}
          onExecuteDirective={(crisis) => {
            setActiveCrisis(crisis);
            setCurrentView('chat');
          }}
        />
      )}
    </div>
  );
};
