import { EmployeeProfile, EmployeeSettings, RelationshipState } from '@prisma/client';
import { TASK_CONFIG, DND_CONFIG } from '../config/constants.js';
import { AppError } from '../utils/response.js';

export interface TaskCreationOptions {
  isEmergency?: boolean;
  overrideAbsurdityLevel?: number;
  manualTrigger?: boolean;
  scenarioTheme?: string;
}

/**
 * Check if a new task can be created for the employee right now.
 * Enforces DND, cooldowns, and emergency cooldowns.
 */
export function checkTaskCreationAllowed(
  profile: EmployeeProfile,
  settings: EmployeeSettings,
  opts: TaskCreationOptions = {},
): void {
  // DND check — skip for emergencies and manual admin triggers
  if (settings.doNotDisturb && !opts.isEmergency && !opts.manualTrigger) {
    throw new AppError('EMPLOYEE_DND', 'Employee has Do Not Disturb enabled', 429);
  }

  // Emergency cooldown — skip for manual admin triggers
  if (opts.isEmergency && !opts.manualTrigger && profile.lastEmergencyAt) {
    const timeSinceLastEmergency = Date.now() - profile.lastEmergencyAt.getTime();
    if (timeSinceLastEmergency < TASK_CONFIG.EMERGENCY_COOLDOWN_MS) {
      const waitMinutes = Math.ceil(
        (TASK_CONFIG.EMERGENCY_COOLDOWN_MS - timeSinceLastEmergency) / 60000,
      );
      throw new AppError(
        'EMERGENCY_COOLDOWN',
        `Emergency cooldown active. Wait ${waitMinutes} more minute(s).`,
        429,
      );
    }
  }
}

/**
 * Determine the task category to use — mostly left to AI but can be overridden.
 * Returns undefined to let the AI decide.
 */
export function determineTaskCategory(
  profile: EmployeeProfile,
  isEmergency: boolean,
): string | undefined {
  if (isEmergency) return 'EMERGENCY';
  // Let AI decide based on context
  return undefined;
}
