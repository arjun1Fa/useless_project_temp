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
import { EmergencyHUD } from './components/EmergencyHUD';
import { PromotionModal } from './components/PromotionModal';
import { humanSfx } from './utils/audio';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [activeCrisis, setActiveCrisis] = useState<CrisisTask>(PRECOMPILED_CRISES[0]);
  const [profile, setProfile] = useState<WingmanProfile>(INITIAL_WINGMAN_PROFILE);
  const [evaluations, setEvaluations] = useState<EvaluationOutput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promotion modal state
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotedRank, setPromotedRank] = useState<WingmanProfile['rank']>('CERTIFIED_WINGMAN');
  const [proclamationText, setProclamationText] = useState('');

  // Sync with Port 3000 (Anti-Claude UI) via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('anti-claude-sync-channel');

    channel.onmessage = (event) => {
      const { type, payload } = event.data;

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

    // Notify Anti-Claude that the human opened the hotline
    channel.postMessage({ type: 'WINGMAN_TASK_SEEN', payload: { taskId: activeCrisis.id } });

    return () => {
      channel.close();
    };
  }, [activeCrisis.id]);

  const broadcastToStudent = (type: string, payload: unknown) => {
    try {
      const channel = new BroadcastChannel('anti-claude-sync-channel');
      channel.postMessage({ type, payload });
      channel.close();
    } catch {
      // Fallback
    }
  };

  const handleDraftChange = (draftText: string, hasAttachment: boolean) => {
    broadcastToStudent('WINGMAN_KEYSTROKE', { draftText, hasAttachment });
  };

  const handleSubmitResponse = (text: string, attachment?: string) => {
    setIsSubmitting(true);
    broadcastToStudent('WINGMAN_SUBMISSION', { text, attachment });
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

      {/* Active View: Home Voice Actuator OR Minimal Dashboard */}
      {currentView === 'home' ? (
        <VoiceActuatorHome
          activeCrisis={activeCrisis}
          onSubmitResponse={handleSubmitResponse}
          onNavigateToDashboard={() => setCurrentView('dashboard')}
          onDraftChange={handleDraftChange}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ActuatorDashboard
          profile={profile}
          activeCrisis={activeCrisis}
          evaluations={evaluations}
          onNavigateToHome={() => setCurrentView('home')}
          onExecuteDirective={(crisis) => {
            setActiveCrisis(crisis);
            setCurrentView('home');
          }}
        />
      )}
    </div>
  );
};
