import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createTaskForEmployee } from '../tasks/task.engine.js';
import { promotionService } from '../services/promotion.service.js';
import { employeeRepo } from '../db/repositories/employee.repo.js';
import { taskRepo } from '../db/repositories/task.repo.js';
import { memoryRepo } from '../db/repositories/memory.repo.js';
import { messageRepo } from '../db/repositories/message.repo.js';
import { schedulerService } from '../scheduler/scheduler.service.js';
import { buildAIContext } from '../ai/context.builder.js';
import { eventRepo } from '../db/repositories/event.repo.js';
import { scheduledJobRepo } from '../db/repositories/scheduled-job.repo.js';
import { prisma } from '../db/client.js';
import { sendSuccess } from '../utils/response.js';
import { FIXED_EMPLOYEE_ID } from '../config/constants.js';

const FIXED_USER_ID = 'user_fixed_001';

const absurditySchema = z.object({
  level: z.number().int().min(1).max(5),
});

const triggerSchema = z.object({
  isEmergency: z.boolean().optional().default(false),
  overrideAbsurdityLevel: z.number().int().min(1).max(5).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']).optional(),
  scenarioTheme: z.string().optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  // POST /api/v1/admin/tasks/trigger — uses the SAME production pipeline
  app.post('/tasks/trigger', {
    schema: { tags: ['admin'], summary: 'Manually trigger a new task (same pipeline as scheduler)' },
  }, async (req, reply) => {
    const body = triggerSchema.parse(req.body ?? {});
    const isEmergency = body.isEmergency || body.priority === 'EMERGENCY';
    // If not specified, pick a random absurdity level between 1 and 5
    const absurdity = body.overrideAbsurdityLevel ?? (Math.floor(Math.random() * 5) + 1);

    const result = await createTaskForEmployee(FIXED_USER_ID, {
      isEmergency,
      overrideAbsurdityLevel: absurdity,
      scenarioTheme: body.scenarioTheme,
      manualTrigger: true,
    });
    return sendSuccess(reply, result, 201);
  });

  // POST /api/v1/admin/tasks/emergency
  app.post('/tasks/emergency', {
    schema: { tags: ['admin'], summary: 'Trigger an emergency task (CRITICAL priority)' },
  }, async (_req, reply) => {
    const result = await createTaskForEmployee(FIXED_USER_ID, {
      isEmergency: true,
      manualTrigger: true,
    });
    return sendSuccess(reply, result, 201);
  });

  // POST /api/v1/admin/employee/promote
  app.post('/employee/promote', {
    schema: { tags: ['admin'], summary: 'Force promote the employee one rank' },
  }, async (_req, reply) => {
    const profile = await employeeRepo.findByUserId(FIXED_USER_ID);
    if (!profile) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });

    const [recentTasks, recentMessages, memories] = await Promise.all([
      taskRepo.getRecentByUserId(FIXED_USER_ID, 5),
      messageRepo.getRecentByUserId(FIXED_USER_ID, 10),
      memoryRepo.findByEmployeeId(profile.id, { limit: 5 }),
    ]);

    // Temporarily boost score to trigger promotion
    const currentScore = profile.score;
    await employeeRepo.update(FIXED_USER_ID, { score: currentScore + 50 });

    const aiContext = buildAIContext(profile as any, memories, recentTasks as any, recentMessages as any);
    const result = await promotionService.checkAndPromote(FIXED_USER_ID, aiContext);

    if (!result.promoted) {
      // Revert score if no promotion happened (already at CEO or next threshold not reached)
      await employeeRepo.update(FIXED_USER_ID, { score: currentScore });
    }

    return sendSuccess(reply, result);
  });

  // POST /api/v1/admin/employee/absurdity
  app.post('/employee/absurdity', {
    schema: { tags: ['admin'], summary: 'Set employee absurdity level (1-5)' },
  }, async (req, reply) => {
    const { level } = absurditySchema.parse(req.body);
    await employeeRepo.update(FIXED_USER_ID, { absurdityLevel: level });
    return sendSuccess(reply, { absurdityLevel: level });
  });

  // POST /api/v1/admin/employee/reset
  app.post('/employee/reset', {
    schema: { tags: ['admin'], summary: 'Reset employee state (score, rank, stats, relationship)' },
  }, async (req, reply) => {
    const { clearMemories } = (req.body as any) ?? {};

    const profile = await employeeRepo.findByUserId(FIXED_USER_ID);
    if (!profile) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });

    await prisma.$transaction(async (tx) => {
      // Reset profile
      await tx.employeeProfile.update({
        where: { userId: FIXED_USER_ID },
        data: {
          score: 0,
          rank: 'INTERN',
          tasksCompleted: 0,
          tasksIgnored: 0,
          tasksRejected: 0,
          tasksFailed: 0,
          totalInteractions: 0,
          absurdityLevel: 1,
          creativityScore: 50,
          complianceScore: 50,
          loyaltyScore: 50,
          initiativeScore: 50,
          averageResponseTime: 0,
          currentStatus: 'ACTIVE',
          lastEmergencyAt: null,
        },
      });

      // Reset relationship
      await tx.relationshipState.update({
        where: { employeeId: profile.id },
        data: {
          trust: 50,
          respect: 50,
          annoyance: 10,
          dependence: 20,
          familiarity: 5,
          suspicion: 5,
        },
      });

      // Cancel pending jobs
      await tx.scheduledJob.updateMany({
        where: { userId: FIXED_USER_ID, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      // Optionally clear memories
      if (clearMemories) {
        await tx.memory.deleteMany({ where: { employeeId: profile.id } });
      }
    });

    return sendSuccess(reply, { reset: true });
  });

  // GET /api/v1/admin/tasks
  app.get('/tasks', {
    schema: { tags: ['admin'], summary: 'Get all tasks (admin view)' },
  }, async (_req, reply) => {
    const tasks = await taskRepo.findByUserId(FIXED_USER_ID, { limit: 100 });
    return sendSuccess(reply, tasks);
  });

  // GET /api/v1/admin/events
  app.get('/events', {
    schema: { tags: ['admin'], summary: 'Get recent system events' },
  }, async (_req, reply) => {
    const events = await eventRepo.findAll(100);
    return sendSuccess(reply, events);
  });

  // GET /api/v1/admin/jobs
  app.get('/jobs', {
    schema: { tags: ['admin'], summary: 'Get scheduled jobs' },
  }, async (_req, reply) => {
    const jobs = await prisma.scheduledJob.findMany({
      orderBy: { scheduledFor: 'desc' },
      take: 50,
    });
    return sendSuccess(reply, jobs);
  });
}
