import { prisma } from '../db/client.js';
import { memoryRepo } from '../db/repositories/memory.repo.js';
import { extractMemories } from '../ai/reaction.generator.js';
import { MEMORY_CONFIG } from '../config/constants.js';
import { MemoryType } from '@prisma/client';
import { logger } from '../utils/logger.js';

export const memoryService = {
  /**
   * Extract and store memories from a completed interaction.
   * Only runs every N tasks (configurable) to avoid excessive AI calls.
   */
  async extractAndStore(
    userId: string,
    employeeId: string,
    totalInteractions: number,
    taskTitle: string,
    humanResponse: string,
    evaluationFeedback: string,
    sourceTaskId?: string,
  ): Promise<void> {
    // Only extract every N tasks
    if (totalInteractions % MEMORY_CONFIG.EXTRACTION_EVERY_N_TASKS !== 0) {
      return;
    }

    try {
      const extracted = await extractMemories(taskTitle, humanResponse, evaluationFeedback);

      if (!extracted.shouldRemember || extracted.memories.length === 0) {
        return;
      }

      // Check if we're at the memory limit — prune old low-importance ones if so
      const memoryCount = await memoryRepo.countByEmployeeId(employeeId);
      if (memoryCount >= MEMORY_CONFIG.MAX_STORED_MEMORIES) {
        await memoryRepo.deleteOldest(employeeId);
      }

      // Store each memory
      for (const mem of extracted.memories) {
        if (mem.importance < MEMORY_CONFIG.MIN_IMPORTANCE_TO_STORE) continue;

        await memoryRepo.create({
          userId,
          profile: { connect: { id: employeeId } },
          content: mem.content,
          type: mem.type as MemoryType,
          importance: mem.importance,
          sourceTaskId: sourceTaskId ?? null,
        });
      }

      logger.info(
        { employeeId, count: extracted.memories.length },
        'Memories extracted and stored',
      );
    } catch (err) {
      // Memory failure should never crash the evaluation flow
      logger.warn({ err }, 'Memory extraction failed — skipping');
    }
  },

  async getRelevantMemories(employeeId: string, limit = 5): Promise<string[]> {
    const memories = await memoryRepo.findByEmployeeId(employeeId, {
      limit,
      minImportance: MEMORY_CONFIG.MIN_IMPORTANCE_TO_STORE,
    });
    return memories.map((m) => m.content);
  },
};
