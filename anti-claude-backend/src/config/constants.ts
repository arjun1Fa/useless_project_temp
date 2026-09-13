// ─── All configurable business rules for Anti-Claude ───────────────────────
// Change these values to tune game behavior without touching AI or service code.

// ─── Employee Ranks & Score Thresholds ─────────────────────────────────────
export const RANKS = [
  'INTERN',
  'JUNIOR_HUMAN',
  'HUMAN_ASSOCIATE',
  'SENIOR_HUMAN',
  'HUMAN_SPECIALIST',
  'HUMAN_OPERATIONS_MANAGER',
  'DIRECTOR_OF_HUMAN_AFFAIRS',
  'CHIEF_HUMAN_OFFICER',
  'CEO',
] as const;

export type Rank = (typeof RANKS)[number];

export const RANK_THRESHOLDS: Record<Rank, number> = {
  INTERN: 0,
  JUNIOR_HUMAN: 5,
  HUMAN_ASSOCIATE: 10,
  SENIOR_HUMAN: 20,
  HUMAN_SPECIALIST: 35,
  HUMAN_OPERATIONS_MANAGER: 60,
  DIRECTOR_OF_HUMAN_AFFAIRS: 100,
  CHIEF_HUMAN_OFFICER: 150,
  CEO: 200,
};

// ─── Absurdity Engine ────────────────────────────────────────────────────────
// Base level always starts at 1. Increments at interaction milestones.
export const ABSURDITY_MILESTONES = [5, 15, 30, 50]; // interaction counts
export const ABSURDITY_MAX = 5;
export const ABSURDITY_MIN = 1;
export const ABSURDITY_RANDOM_VARIANCE = 1; // ±1 random variance allowed
export const ABSURDITY_VARIANCE_PROBABILITY = 0.3; // 30% chance of variance

// ─── Relationship Deltas ─────────────────────────────────────────────────────
// How relationship state changes after each outcome
export const RELATIONSHIP_DELTAS = {
  TASK_COMPLETED: {
    trust: 1,
    respect: 1,
    annoyance: -1,
    dependence: 0,
    familiarity: 1,
    suspicion: 0,
  },
  TASK_COMPLETED_EXCEPTIONAL: {
    trust: 3,
    respect: 3,
    annoyance: -2,
    dependence: 1,
    familiarity: 1,
    suspicion: -1,
  },
  TASK_IGNORED: {
    trust: -1,
    respect: -1,
    annoyance: 2,
    dependence: 0,
    familiarity: 0,
    suspicion: 1,
  },
  TASK_IGNORED_REPEAT: {
    trust: -2,
    respect: -2,
    annoyance: 3,
    dependence: 0,
    familiarity: 0,
    suspicion: 2,
  },
  TASK_REJECTED: {
    trust: -2,
    respect: -2,
    annoyance: 2,
    dependence: 0,
    familiarity: 1,
    suspicion: 1,
  },
  TASK_POOR: {
    trust: 0,
    respect: -1,
    annoyance: 1,
    dependence: 0,
    familiarity: 1,
    suspicion: 0,
  },
  LONG_TERM_INTERACTION: {
    trust: 0,
    respect: 0,
    annoyance: 0,
    dependence: 1,
    familiarity: 1,
    suspicion: 0,
  },
};

// Relationship value bounds
export const RELATIONSHIP_MIN = 0;
export const RELATIONSHIP_MAX = 100;

// ─── Scoring ─────────────────────────────────────────────────────────────────
export const SCORING = {
  BASE_WEIGHT: 0.6,
  SPEED_WEIGHT: 0.15,
  CREATIVITY_WEIGHT: 0.15,
  LOYALTY_WEIGHT: 0.1,
  MAX_SCORE_PER_TASK: 20,
  MIN_SCORE_PER_TASK: -5,
};

// ─── Task Generation ─────────────────────────────────────────────────────────
export const TASK_CONFIG = {
  SELF_DELEGATION_PROBABILITY: 0.15, // 15% chance
  DEFAULT_DEADLINE_SECONDS: 600, // 10 minutes
  EMERGENCY_DEADLINE_SECONDS: 300, // 5 minutes
  EMERGENCY_COOLDOWN_MS: 30 * 60 * 1000, // 30 minutes between emergencies
  MAX_RECENT_TASKS_CONTEXT: 5,
  MAX_RECENT_MESSAGES_CONTEXT: 10,
  MAX_MEMORIES_CONTEXT: 5,
};

// ─── Scheduler ───────────────────────────────────────────────────────────────
export const SCHEDULER_CONFIG = {
  NEXT_TASK_DELAY_MS: 10 * 60 * 1000, // 10 min after task completion
  INACTIVITY_THRESHOLD_MS: 30 * 60 * 1000, // trigger after 30 min inactivity
  DND_CHECK_INTERVAL_MS: 5 * 60 * 1000, // 5 min
  MAX_PENDING_JOBS_PER_USER: 3,
};

// ─── DND / Cooldowns ─────────────────────────────────────────────────────────
export const DND_CONFIG = {
  TASK_COOLDOWN_MS: 10 * 60 * 1000, // 10 min cooldown between tasks
  DND_OVERRIDE_MESSAGE: "I know you said not to disturb you, but this is urgent.",
};

// ─── Memory ──────────────────────────────────────────────────────────────────
export const MEMORY_CONFIG = {
  MIN_IMPORTANCE_TO_STORE: 6, // 1-10 scale, only store >= 6
  MAX_STORED_MEMORIES: 100,
  EXTRACTION_EVERY_N_TASKS: 3, // run memory extraction every 3 tasks
};

// ─── Fixed Employee ───────────────────────────────────────────────────────────
// Single-employee hackathon mode — this ID is seeded and used across all requests
export const FIXED_EMPLOYEE_ID = 'employee_fixed_001';

// ─── AI ──────────────────────────────────────────────────────────────────────
export const AI_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TASK_GENERATION_TEMPERATURE: 0.9,
  EVALUATION_TEMPERATURE: 0.3,
  REACTION_TEMPERATURE: 0.85,
  MEMORY_EXTRACTION_TEMPERATURE: 0.2,
};

// ─── File Upload ─────────────────────────────────────────────────────────────
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf',
    'application/json',
  ],
};
