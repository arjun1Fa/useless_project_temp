import { prisma } from '../db/client.js';
import { employeeRepo } from '../db/repositories/employee.repo.js';
import { taskRepo } from '../db/repositories/task.repo.js';
import { messageRepo } from '../db/repositories/message.repo.js';
import { memoryRepo } from '../db/repositories/memory.repo.js';
import { notificationRepo } from '../db/repositories/notification.repo.js';
import { eventRepo } from '../db/repositories/event.repo.js';
import { buildAIContext } from '../ai/context.builder.js';
import { generateTask } from '../ai/task.generator.js';
import { absurdityService } from '../services/absurdity.service.js';
import { realtimeGateway } from '../events/realtime.gateway.js';
import { TASK_CONFIG, FIXED_EMPLOYEE_ID, MEMORY_CONFIG } from '../config/constants.js';
import { checkTaskCreationAllowed } from './task.rules.js';
import { AppError, NotFoundError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { TaskCreationOptions } from './task.rules.js';
import { Prisma } from '@prisma/client';

/**
 * THE CENTRAL TASK CREATION PIPELINE
 * 17-step flow — the single path for ALL task generation in the system.
 * Admin triggers, scheduler triggers, and manual triggers all call this.
 */
export async function createTaskForEmployee(
  userId: string,
  opts: TaskCreationOptions = {},
): Promise<{ taskId: string; title: string }> {
  logger.info({ userId, opts }, 'TaskEngine: Starting task creation');

  // ─── Step 1: Load employee ───────────────────────────────────────────────
  const profile = await employeeRepo.findByUserId(userId);
  if (!profile) throw new NotFoundError('Employee profile');

  // ─── Step 2: Load settings ────────────────────────────────────────────────
  const settings = profile.settings;
  if (!settings) throw new AppError('SETTINGS_MISSING', 'Employee settings not found', 500);

  // DND + cooldown checks
  checkTaskCreationAllowed(profile, settings, opts);

  // ─── Step 3 & 4: Load recent history + memories ──────────────────────────
  const [recentTasks, recentMessages, memories] = await Promise.all([
    taskRepo.getRecentByUserId(userId, TASK_CONFIG.MAX_RECENT_TASKS_CONTEXT),
    messageRepo.getRecentByUserId(userId, TASK_CONFIG.MAX_RECENT_MESSAGES_CONTEXT),
    memoryRepo.findByEmployeeId(profile.id, {
      limit: TASK_CONFIG.MAX_MEMORIES_CONTEXT,
      minImportance: MEMORY_CONFIG.MIN_IMPORTANCE_TO_STORE,
    }),
  ]);

  // ─── Step 5: Determine absurdity level ──────────────────────────────────
  const absurdityLevel =
    opts.overrideAbsurdityLevel ??
    absurdityService.calculate(profile.totalInteractions, profile.tasksCompleted, profile.tasksIgnored);

  // Update absurdity on profile if changed
  if (absurdityLevel !== profile.absurdityLevel) {
    await employeeRepo.update(userId, { absurdityLevel });
  }

  // ─── Steps 6 & 7: Category & priority — delegated to AI ──────────────────
  // (AI determines based on context, emergency flag overrides priority)

  // ─── Step 8: Build AI context ────────────────────────────────────────────
  const aiContext = buildAIContext(
    { ...profile, absurdityLevel },
    memories,
    recentTasks as any,
    recentMessages as any,
  );

  // ─── Step 9: Call task generator ─────────────────────────────────────────
  const generated = await generateTask(aiContext, {
    isEmergency: opts.isEmergency,
    overrideAbsurdityLevel: absurdityLevel,
    scenarioTheme: opts.scenarioTheme,
  });

  // ─── Step 10: Validate (already done by Zod in task.generator.ts) ─────────
  // ─── Step 11: Apply backend constraints ──────────────────────────────────
  const expiresAt = new Date(
    Date.now() + generated.deadlineSeconds * 1000,
  );

  // ─── Steps 12-16: Persist everything in a transaction ────────────────────
  const result = await prisma.$transaction(async (tx) => {
    // Step 12: Create Task
    const task = await tx.task.create({
      data: {
        userId,
        title: generated.title,
        description: generated.description,
        category: generated.category,
        priority: opts.isEmergency ? 'CRITICAL' : generated.priority,
        status: 'DELIVERED',
        absurdityLevel: generated.absurdityLevel,
        isEmergency: generated.isEmergency || opts.isEmergency || false,
        expectedResponseType: generated.expectedResponseType,
        evaluationCriteria: generated.evaluationCriteria,
        businessValue: generated.businessValue,
        deadlineSeconds: generated.deadlineSeconds,
        deliveredAt: new Date(),
        expiresAt,
      },
    });

    // Step 13: Create AI Message
    const message = await tx.message.create({
      data: {
        userId,
        taskId: task.id,
        senderType: 'AI',
        content: generated.aiMessage,
      },
    });

    // Step 14: Create Notification
    const notification = await tx.notification.create({
      data: {
        userId,
        type: opts.isEmergency ? 'EMERGENCY_TASK' : 'TASK_ASSIGNED',
        title: opts.isEmergency ? '🚨 URGENT TASK' : 'New Task Assigned',
        message: generated.title,
        taskId: task.id,
      },
    });

    // Step 15: Create Event
    const event = await tx.event.create({
      data: {
        userId,
        type: 'TASK_CREATED',
        entityType: 'task',
        entityId: task.id,
        payload: {
          taskId: task.id,
          title: task.title,
          category: task.category,
          priority: task.priority,
          isEmergency: task.isEmergency,
          absurdityLevel: task.absurdityLevel,
        },
      },
    });

    // Update employee lastActive + totalInteractions
    await tx.employeeProfile.update({
      where: { userId },
      data: {
        totalInteractions: { increment: 1 },
        lastActiveAt: new Date(),
        ...(opts.isEmergency ? { lastEmergencyAt: new Date() } : {}),
      },
    });

    return { task, message, notification, event };
  });

  // ─── Step 16: Emit realtime event ─────────────────────────────────────────
  realtimeGateway.broadcast(userId, 'TASK_CREATED', {
    taskId: result.task.id,
    userId,
    title: result.task.title,
    priority: result.task.priority,
    isEmergency: result.task.isEmergency,
    absurdityLevel: result.task.absurdityLevel,
    aiMessage: generated.aiMessage,
  });

  realtimeGateway.broadcast(userId, 'AI_MESSAGE_CREATED', {
    id: result.message.id,
    taskId: result.task.id,
    userId,
    content: result.message.content,
    senderType: 'AI',
    createdAt: result.message.createdAt,
  });

  realtimeGateway.broadcast(userId, 'NOTIFICATION_CREATED', {
    notificationId: result.notification.id,
    title: result.notification.title,
    message: result.notification.message,
  });

  logger.info({ taskId: result.task.id, title: result.task.title }, 'TaskEngine: Task created successfully');

  // ─── Step 17: Return ──────────────────────────────────────────────────────
  return { taskId: result.task.id, title: result.task.title };
}
