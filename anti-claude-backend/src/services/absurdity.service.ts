import {
  ABSURDITY_MILESTONES,
  ABSURDITY_MAX,
  ABSURDITY_MIN,
  ABSURDITY_RANDOM_VARIANCE,
  ABSURDITY_VARIANCE_PROBABILITY,
} from '../config/constants.js';

export const absurdityService = {
  /**
   * Deterministic absurdity calculation based on interaction history.
   * Base = 1, increments at each milestone. Optional ±1 variance.
   */
  calculate(
    totalInteractions: number,
    tasksCompleted: number,
    tasksIgnored: number,
    applyVariance = true,
  ): number {
    let level = ABSURDITY_MIN;

    // Increment for each milestone passed
    for (const milestone of ABSURDITY_MILESTONES) {
      if (totalInteractions >= milestone) {
        level++;
      }
    }

    // Optional random variance
    if (applyVariance && Math.random() < ABSURDITY_VARIANCE_PROBABILITY) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      level += direction * ABSURDITY_RANDOM_VARIANCE;
    }

    // Clamp to 1-5
    return Math.max(ABSURDITY_MIN, Math.min(ABSURDITY_MAX, level));
  },
};
