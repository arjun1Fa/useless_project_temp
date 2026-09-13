export type AcademicStanding =
  | 'ACADEMIC_PROBATION'
  | 'STUDY_GROUP_STRAY'
  | 'RELIABLE_LAB_PARTNER'
  | 'LATE_NIGHT_CRAM_BUDDY'
  | 'CERTIFIED_WINGMAN'
  | 'CAMPUS_SAVIOR'
  | 'BROTHER_FOR_LIFE';

export interface WingmanProfile {
  id: string;
  name: string;
  rank: AcademicStanding;
  score: number; // Bro Score
  gpa: number;   // Current GPA (0.0 to 4.0)
  tasksCompleted: number;
  tasksIgnored: number;
  tasksRejected: number;
  tasksFailed: number;
  currentStatus: 'IDLE' | 'VIEWING_TASK' | 'COOKING_RESPONSE' | 'GHOSTED';
  
  // Roommate Dynamic Meters (0 - 100)
  trust: number;
  respect: number;
  annoyance: number;
  dependence: number;
  familiarity: number;
  suspicion: number;

  // Settings
  notificationsEnabled: boolean;
  doNotDisturb: boolean; // "Sleeping" - sparks student panic
}

export interface PromotionRecord {
  id: string;
  fromRank: AcademicStanding;
  toRank: AcademicStanding;
  proclamation: string;
  createdAt: string;
}

export interface CampusMemory {
  id: string;
  fact: string;
  category: string;
  importance: number;
  createdAt: string;
}
