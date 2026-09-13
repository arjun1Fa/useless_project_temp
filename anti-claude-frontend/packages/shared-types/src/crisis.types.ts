export type CrisisCategory =
  | 'academic_cram'
  | 'crush_dilemma'
  | 'roommate_warfare'
  | 'professor_negotiation'
  | 'dorm_survival';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus =
  | 'CREATED'
  | 'DELIVERED'
  | 'SEEN'
  | 'RESPONDED'
  | 'EVALUATING'
  | 'EVALUATED'
  | 'CLOSED'
  | 'IGNORED'
  | 'REJECTED'
  | 'EXPIRED';

export type ExpectedResponseType = 'text' | 'image' | 'file' | 'text_or_image';

export interface CrisisTask {
  id: string;
  title: string;
  message: string;
  category: CrisisCategory;
  priority: Priority;
  absurdityLevel: number; // 1 to 5
  isEmergency: boolean;
  emergencyReason?: string;
  expectedResponseType: ExpectedResponseType;
  timeLimitSeconds?: number;
  status: TaskStatus;
  createdAt: string;
  deliveredAt?: string;
  seenAt?: string;
  respondedAt?: string;
  responseText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  evaluation?: EvaluationOutput;
}

export interface EvaluationOutput {
  taskId: string;
  passed: boolean;
  scoreDelta: number; // e.g. -50 to +100
  gpaDelta: number;   // e.g. -0.2 to +0.3
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  feedbackMessage: string;
  frustrationLevel: number; // 0 (chill/ecstatic) to 100 (total unhinged meltdown)
  critique: {
    rizzOrConvincingScore: number;
    naturalnessScore: number;
    biologicalEffortScore: number;
    overallAssessment: string;
  };
  relationshipDelta: {
    trust: number;
    respect: number;
    annoyance: number;
    dependence: number;
    familiarity: number;
    suspicion: number;
  };
  discoveredFacts: string[];
}
