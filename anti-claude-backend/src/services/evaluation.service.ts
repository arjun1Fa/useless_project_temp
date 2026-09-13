import { prisma } from '../db/client.js';
import { taskRepo } from '../db/repositories/task.repo.js';
import { employeeRepo } from '../db/repositories/employee.repo.js';
import { memoryRepo } from '../db/repositories/memory.repo.js';
import { messageRepo } from '../db/repositories/message.repo.js';
import { buildAIContext } from '../ai/context.builder.js';
import { evaluateResponse } from '../ai/evaluator.js';
import { generateReaction } from '../ai/reaction.generator.js';
import { relationshipService } from './relationship.service.js';
import { promotionService } from './promotion.service.js';
import { memoryService } from './memory.service.js';
import { realtimeGateway } from '../events/realtime.gateway.js';
import { schedulerService } from '../scheduler/scheduler.service.js';
import { SCORING } from '../config/constants.js';
import { Verdict } from '@prisma/client';
import { logger } from '../utils/logger.js';

/**
 * ASYNCHRONOUS EVALUATION FLOW
 * Runs entirely in the background after HTTP response is returned.
 * Never called directly from a route handler — triggered by TASK_RESPONDED event.
 */
export const evaluationService = {
  async runEvaluation(taskId: string, userId: string, humanResponseContent: string): Promise<void> {
    logger.info({ taskId, userId }, 'EvaluationService: Starting background evaluation');

    try {
      // ─── Load all context ───────────────────────────────────────────────
      const [task, profile, memories, recentMessages] = await Promise.all([
        taskRepo.findById(taskId),
        employeeRepo.findByUserId(userId),
        memoryRepo.findByEmployeeId('', { limit: 5 }), // Will be updated after profile load
        messageRepo.getRecentByUserId(userId, 10),
      ]);

      if (!task || !profile) {
        logger.error({ taskId, userId }, 'Task or profile not found for evaluation');
        return;
      }

      const profileMemories = await memoryRepo.findByEmployeeId(profile.id, { limit: 5 });

      // ─── Build AI context ────────────────────────────────────────────────
      const recentTasks = await taskRepo.getRecentByUserId(userId, 5);
      const aiContext = buildAIContext(
        profile as any,
        profileMemories,
        recentTasks as any,
        recentMessages as any,
      );

      // ─── Call Grok evaluator ─────────────────────────────────────────────
      realtimeGateway.broadcast(userId, 'TASK_EVALUATING', { taskId });

      const evaluation = await evaluateResponse(
        aiContext,
        task.title,
        task.description,
        task.category,
        task.absurdityLevel,
        task.evaluationCriteria,
        humanResponseContent,
        task.deliveredAt ?? task.createdAt,
        task.respondedAt ?? new Date(),
      );

      // ─── Calculate score delta ───────────────────────────────────────────
      const responseTimeSeconds = task.respondedAt && task.deliveredAt
        ? Math.round((task.respondedAt.getTime() - task.deliveredAt.getTime()) / 1000)
        : 999;

      const scoreDelta = calculateScoreDelta(evaluation.score, responseTimeSeconds, evaluation.creativity);

      // ─── Persist in transaction ──────────────────────────────────────────
      let wasPromoted = false;
      let promotionData: { newRank?: string; previousRank?: string; aiMessage?: string } = {};

      await prisma.$transaction(async (tx) => {
        // Persist evaluation
        await tx.evaluation.create({
          data: {
            taskId,
            score: evaluation.score,
            creativity: evaluation.creativity,
            compliance: evaluation.compliance,
            initiative: evaluation.initiative,
            reasoning: evaluation.reasoning,
            speed: evaluation.speed,
            feedback: evaluation.feedback,
            verdict: evaluation.verdict,
            memoryCandidates: evaluation.memoryCandidates,
          },
        });

        // Update task → COMPLETED
        await tx.task.update({
          where: { id: taskId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        // Update employee stats + score
        const newScore = Math.max(0, profile.score + scoreDelta);
        await tx.employeeProfile.update({
          where: { userId },
          data: {
            score: newScore,
            tasksCompleted: { increment: 1 },
            totalInteractions: { increment: 1 },
            creativityScore: weightedAvg(profile.creativityScore, evaluation.creativity, profile.tasksCompleted),
            complianceScore: weightedAvg(profile.complianceScore, evaluation.compliance, profile.tasksCompleted),
            initiativeScore: weightedAvg(profile.initiativeScore, evaluation.initiative, profile.tasksCompleted),
            averageResponseTime: weightedAvg(profile.averageResponseTime, responseTimeSeconds, profile.tasksCompleted),
            lastActiveAt: new Date(),
          },
        });

        // Create event
        await tx.event.create({
          data: {
            userId,
            type: 'TASK_EVALUATED',
            entityType: 'task',
            entityId: taskId,
            payload: {
              taskId,
              score: evaluation.score,
              verdict: evaluation.verdict,
              scoreDelta,
            },
          },
        });
      });

      // ─── Update relationship state ────────────────────────────────────────
      const outcome = verdictToOutcome(evaluation.verdict, profile.tasksIgnored);
      await relationshipService.applyOutcome(profile.id, outcome);

      // ─── Check promotion ─────────────────────────────────────────────────
      // Reload profile with updated score
      const updatedProfile = await employeeRepo.findByUserId(userId);
      if (updatedProfile) {
        const updatedContext = buildAIContext(updatedProfile as any, profileMemories, recentTasks as any, recentMessages as any);
        const promotionResult = await promotionService.checkAndPromote(userId, updatedContext);
        wasPromoted = promotionResult.promoted;
        promotionData = {
          newRank: promotionResult.newRank,
          previousRank: promotionResult.previousRank,
          aiMessage: promotionResult.aiMessage,
        };
      }

      // ─── Generate AI reaction ────────────────────────────────────────────
      const reactionMessage = await generateReaction(
        aiContext,
        task.title,
        humanResponseContent,
        evaluation.score,
        evaluation.verdict,
        evaluation.feedback,
        wasPromoted,
        promotionData.newRank,
        promotionData.previousRank,
      );

      // Persist AI reaction message
      const aiReactionRecord = await prisma.message.create({
        data: {
          userId,
          taskId,
          senderType: 'AI',
          content: reactionMessage,
          metadata: { type: 'EVALUATION_REACTION', verdict: evaluation.verdict, score: evaluation.score, scoreDelta },
        },
      });

      // ─── Extract & store memories ────────────────────────────────────────
      await memoryService.extractAndStore(
        userId,
        profile.id,
        profile.totalInteractions,
        task.title,
        humanResponseContent,
        evaluation.feedback,
        taskId,
      );

      // ─── Emit realtime events ─────────────────────────────────────────────
      realtimeGateway.broadcast(userId, 'TASK_COMPLETED', {
        taskId,
        score: evaluation.score,
        verdict: evaluation.verdict,
        scoreDelta,
      });

      realtimeGateway.broadcast(userId, 'TASK_EVALUATED', {
        taskId,
        evaluation: {
          score: evaluation.score,
          creativity: evaluation.creativity,
          compliance: evaluation.compliance,
          verdict: evaluation.verdict,
          feedback: evaluation.feedback,
        },
      });

      realtimeGateway.broadcast(userId, 'AI_MESSAGE_CREATED', {
        id: aiReactionRecord.id,
        taskId,
        content: reactionMessage,
        senderType: 'AI',
        metadata: { type: 'EVALUATION_REACTION', verdict: evaluation.verdict, score: evaluation.score, scoreDelta },
        createdAt: aiReactionRecord.createdAt,
      });

      realtimeGateway.broadcast(userId, 'EMPLOYEE_SCORE_UPDATED', {
        userId,
        newScore: Math.max(0, profile.score + scoreDelta),
        scoreDelta,
      });

      // ─── Schedule next task ───────────────────────────────────────────────
      await schedulerService.scheduleNextTask(userId);

      logger.info({ taskId, verdict: evaluation.verdict, scoreDelta }, 'EvaluationService: Complete');
    } catch (err) {
      logger.error({ taskId, userId, err }, 'EvaluationService: Fatal error');

      // Mark task as FAILED if evaluation crashes
      try {
        await taskRepo.update(taskId, { status: 'FAILED' });
        realtimeGateway.broadcast(userId, 'TASK_EVALUATED', { taskId, error: 'Evaluation failed' });
      } catch {}
    }
  },
};

// ─── Score Calculation ────────────────────────────────────────────────────────
function calculateScoreDelta(
  evaluationScore: number,
  responseTimeSeconds: number,
  creativityScore: number,
): number {
  const base = Math.round(evaluationScore * SCORING.BASE_WEIGHT / 10);
  const speedBonus = responseTimeSeconds < 120 ? 2 : responseTimeSeconds < 300 ? 1 : 0;
  const creativityBonus = creativityScore > 80 ? 1 : 0;

  const total = base + speedBonus + creativityBonus;
  return Math.max(SCORING.MIN_SCORE_PER_TASK, Math.min(SCORING.MAX_SCORE_PER_TASK, total));
}

// ─── Verdict → Relationship Outcome mapping ───────────────────────────────────
function verdictToOutcome(verdict: Verdict, timesIgnored: number): any {
  if (verdict === 'PROMOTABLE' || verdict === 'EXCELLENT') {
    return 'TASK_COMPLETED_EXCEPTIONAL';
  }
  if (verdict === 'POOR') {
    return timesIgnored > 3 ? 'TASK_IGNORED_REPEAT' : 'TASK_POOR';
  }
  return 'TASK_COMPLETED';
}

// ─── Weighted average helper ──────────────────────────────────────────────────
function weightedAvg(current: number, newValue: number, count: number): number {
  if (count === 0) return newValue;
  return Math.round((current * count + newValue) / (count + 1));
}
