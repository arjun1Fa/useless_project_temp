import { TaskStatus } from '@prisma/client';
import { AppError } from '../utils/response.js';

// Legal state transitions — frontend cannot bypass this
const VALID_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  CREATED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['SEEN', 'IGNORED', 'EXPIRED', 'CANCELLED'],
  SEEN: ['RESPONDED', 'IGNORED', 'REJECTED', 'EXPIRED'],
  RESPONDED: ['EVALUATING', 'FAILED'],
  EVALUATING: ['COMPLETED', 'FAILED'],
  // Terminal states — no further transitions
  COMPLETED: [],
  IGNORED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
  FAILED: [],
};

const TERMINAL_STATES: TaskStatus[] = [
  'COMPLETED',
  'IGNORED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'FAILED',
];

export function assertValidTransition(from: TaskStatus, to: TaskStatus): void {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(
      'INVALID_STATE_TRANSITION',
      `Cannot transition task from ${from} to ${to}`,
      409,
    );
  }
}

export function isTerminal(status: TaskStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

export function canRespond(status: TaskStatus): boolean {
  return status === 'SEEN' || status === 'DELIVERED';
}

export function canIgnore(status: TaskStatus): boolean {
  return status === 'DELIVERED' || status === 'SEEN';
}

export function canReject(status: TaskStatus): boolean {
  return status === 'SEEN' || status === 'DELIVERED';
}
