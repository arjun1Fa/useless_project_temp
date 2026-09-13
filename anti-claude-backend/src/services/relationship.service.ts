import { relationshipRepo } from '../db/repositories/relationship.repo.js';
import { RELATIONSHIP_DELTAS, RELATIONSHIP_MIN, RELATIONSHIP_MAX } from '../config/constants.js';
import { logger } from '../utils/logger.js';

type RelationshipOutcome = keyof typeof RELATIONSHIP_DELTAS;
type RelationshipField = 'trust' | 'respect' | 'annoyance' | 'dependence' | 'familiarity' | 'suspicion';

export const relationshipService = {
  /**
   * Apply relationship delta based on task outcome.
   * Clamps all values to 0-100.
   */
  async applyOutcome(employeeId: string, outcome: RelationshipOutcome): Promise<void> {
    const current = await relationshipRepo.findByEmployeeId(employeeId);
    if (!current) {
      logger.warn({ employeeId }, 'RelationshipState not found, skipping update');
      return;
    }

    const deltas = RELATIONSHIP_DELTAS[outcome];
    const fields: RelationshipField[] = [
      'trust', 'respect', 'annoyance', 'dependence', 'familiarity', 'suspicion',
    ];

    const updates: Record<string, number> = {};
    for (const field of fields) {
      const delta = deltas[field] ?? 0;
      const newValue = Math.max(RELATIONSHIP_MIN, Math.min(RELATIONSHIP_MAX, current[field] + delta));
      updates[field] = newValue;
    }

    await relationshipRepo.update(employeeId, updates);
    logger.debug({ employeeId, outcome, updates }, 'Relationship updated');
  },

  clamp(value: number): number {
    return Math.max(RELATIONSHIP_MIN, Math.min(RELATIONSHIP_MAX, value));
  },
};
