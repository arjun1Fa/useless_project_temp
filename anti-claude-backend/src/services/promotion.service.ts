import { prisma } from '../db/client.js';
import { employeeRepo } from '../db/repositories/employee.repo.js';
import { notificationRepo } from '../db/repositories/notification.repo.js';
import { eventRepo } from '../db/repositories/event.repo.js';
import { RANK_THRESHOLDS, RANKS, Rank } from '../config/constants.js';
import { realtimeGateway } from '../events/realtime.gateway.js';
import { generatePromotionMessage } from '../ai/reaction.generator.js';
import { AIContext } from '../ai/context.builder.js';
import { logger } from '../utils/logger.js';

export const promotionService = {
  /**
   * Check if the employee's score qualifies for a rank promotion.
   * If so: update rank, create Promotion record, Event, Notification, AI message, broadcast.
   */
  async checkAndPromote(
    userId: string,
    aiContext: AIContext,
  ): Promise<{ promoted: boolean; newRank?: Rank; previousRank?: Rank; aiMessage?: string }> {
    const profile = await employeeRepo.findByUserId(userId);
    if (!profile) return { promoted: false };

    const currentRank = profile.rank as Rank;
    const score = profile.score;

    // Find the highest rank the employee qualifies for
    let targetRank: Rank = 'INTERN';
    for (const rank of RANKS) {
      if (score >= RANK_THRESHOLDS[rank]) {
        targetRank = rank;
      }
    }

    // No promotion needed
    if (targetRank === currentRank) return { promoted: false };

    // Ensure we're going up, not down
    const currentIdx = RANKS.indexOf(currentRank);
    const targetIdx = RANKS.indexOf(targetRank);
    if (targetIdx <= currentIdx) return { promoted: false };

    // Next rank only (one step at a time for drama)
    const newRank = RANKS[currentIdx + 1] as Rank;

    logger.info({ userId, currentRank, newRank, score }, 'Promotion triggered');

    // Generate AI promotion message
    let aiMessage = '';
    try {
      aiMessage = await generatePromotionMessage(
        aiContext,
        currentRank,
        newRank,
        `Score reached ${score} points`,
      );
    } catch (err) {
      logger.warn({ err }, 'Failed to generate promotion message, using fallback');
      aiMessage = `Effective immediately, your rank has been updated to ${newRank}. Do not let this go to your head.`;
    }

    // Persist promotion in transaction
    await prisma.$transaction(async (tx) => {
      // Update rank
      await tx.employeeProfile.update({
        where: { userId },
        data: { rank: newRank, currentStatus: 'PROMOTED' },
      });

      // Create Promotion record
      const promotion = await tx.promotion.create({
        data: {
          employeeId: profile.id,
          previousRank: currentRank,
          newRank,
          reason: `Score threshold reached: ${score} points`,
          aiMessage,
        },
      });

      // Create Event
      await tx.event.create({
        data: {
          userId,
          type: 'PROMOTION_GRANTED',
          entityType: 'promotion',
          entityId: promotion.id,
          payload: { previousRank: currentRank, newRank, score, aiMessage },
        },
      });

      // Create Notification
      await tx.notification.create({
        data: {
          userId,
          type: 'PROMOTION',
          title: '🎖️ Promoted',
          message: `You have been promoted to ${newRank}`,
          read: false,
        },
      });

      // Create AI reaction message
      await tx.message.create({
        data: {
          userId,
          senderType: 'AI',
          content: aiMessage,
          metadata: { type: 'PROMOTION_ANNOUNCEMENT' },
        },
      });
    });

    // Broadcast realtime event
    realtimeGateway.broadcast(userId, 'PROMOTION_GRANTED', {
      previousRank: currentRank,
      newRank,
      score,
      aiMessage,
    });

    realtimeGateway.broadcast(userId, 'EMPLOYEE_RANK_CHANGED', {
      userId,
      previousRank: currentRank,
      newRank,
    });

    return { promoted: true, newRank, previousRank: currentRank, aiMessage };
  },
};
