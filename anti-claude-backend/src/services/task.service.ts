import { prisma } from '../db/client.js';
import { taskRepo } from '../db/repositories/task.repo.js';
import { messageRepo } from '../db/repositories/message.repo.js';
import { notificationRepo } from '../db/repositories/notification.repo.js';
import { eventRepo } from '../db/repositories/event.repo.js';
import { realtimeGateway } from '../events/realtime.gateway.js';
import { assertValidTransition, canRespond, canIgnore, canReject } from '../tasks/task.state-machine.js';
import { evaluationService } from './evaluation.service.js';
import { AppError, NotFoundError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const taskService = {
  // ─── List tasks for user ────────────────────────────────────────────────
  async list(userId: string, opts?: { status?: string; limit?: number }) {
    return taskRepo.findByUserId(userId, opts as any);
  },

  // ─── Get single task ─────────────────────────────────────────────────────
  async getById(taskId: string, userId: string) {
    const task = await taskRepo.findById(taskId);
    if (!task) throw new NotFoundError('Task');
    if (task.userId !== userId) throw new AppError('FORBIDDEN', 'Task not found', 404);
    return task;
  },

  // ─── Mark task as seen ────────────────────────────────────────────────────
  async markSeen(taskId: string, userId: string) {
    const task = await this.getById(taskId, userId);
    assertValidTransition(task.status, 'SEEN');

    const updated = await taskRepo.updateStatus(taskId, 'SEEN', { seenAt: new Date() });

    realtimeGateway.broadcast(userId, 'TASK_SEEN', { taskId });
    await eventRepo.create({
      type: 'TASK_SEEN',
      entityType: 'task',
      entityId: taskId,
      payload: { taskId },
      user: { connect: { id: userId } },
    });

    return updated;
  },

  // ─── Respond to task ──────────────────────────────────────────────────────
  async respond(
    taskId: string,
    userId: string,
    responseContent: string,
    attachmentIds: string[] = [],
  ) {
    const task = await this.getById(taskId, userId);

    if (!canRespond(task.status)) {
      throw new AppError('INVALID_STATE', `Cannot respond to a task with status ${task.status}`, 409);
    }

    // Persist human message
    const message = await messageRepo.create({
      user: { connect: { id: userId } },
      task: { connect: { id: taskId } },
      senderType: 'HUMAN',
      content: responseContent,
    });

    // Associate attachments
    if (attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { taskId, messageId: message.id },
      });
    }

    // Update task → RESPONDED
    await taskRepo.updateStatus(taskId, 'RESPONDED', { respondedAt: new Date() });

    // Create event
    await eventRepo.create({
      type: 'TASK_RESPONDED',
      entityType: 'task',
      entityId: taskId,
      payload: { taskId, messageId: message.id },
      user: { connect: { id: userId } },
    });

    realtimeGateway.broadcast(userId, 'TASK_RESPONDED', { taskId });

    // ─── Fire-and-forget background evaluation ─────────────────────────────
    // Return immediately, evaluation runs async
    setImmediate(() => {
      evaluationService.runEvaluation(taskId, userId, responseContent).catch((err) => {
        logger.error({ taskId, err }, 'Background evaluation crashed');
      });
    });

    return { taskId, status: 'EVALUATING' };
  },

  // ─── Ignore task ──────────────────────────────────────────────────────────
  async ignore(taskId: string, userId: string) {
    const task = await this.getById(taskId, userId);
    if (!canIgnore(task.status)) {
      throw new AppError('INVALID_STATE', `Cannot ignore a task with status ${task.status}`, 409);
    }

    await taskRepo.updateStatus(taskId, 'IGNORED');
    await prisma.employeeProfile.update({
      where: { userId },
      data: { tasksIgnored: { increment: 1 }, totalInteractions: { increment: 1 } },
    });

    await eventRepo.create({
      type: 'TASK_IGNORED',
      entityType: 'task',
      entityId: taskId,
      payload: { taskId },
      user: { connect: { id: userId } },
    });

    realtimeGateway.broadcast(userId, 'TASK_IGNORED', { taskId });
    return { taskId, status: 'IGNORED' };
  },

  // ─── Reject task ──────────────────────────────────────────────────────────
  async reject(taskId: string, userId: string) {
    const task = await this.getById(taskId, userId);
    if (!canReject(task.status)) {
      throw new AppError('INVALID_STATE', `Cannot reject a task with status ${task.status}`, 409);
    }

    await taskRepo.updateStatus(taskId, 'REJECTED');
    await prisma.employeeProfile.update({
      where: { userId },
      data: { tasksRejected: { increment: 1 }, totalInteractions: { increment: 1 } },
    });

    await eventRepo.create({
      type: 'TASK_REJECTED',
      entityType: 'task',
      entityId: taskId,
      payload: { taskId },
      user: { connect: { id: userId } },
    });

    realtimeGateway.broadcast(userId, 'TASK_IGNORED', { taskId }); // broadcast as ignored for UI
    return { taskId, status: 'REJECTED' };
  },
};
