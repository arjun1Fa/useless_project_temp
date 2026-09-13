import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { taskService } from '../services/task.service.js';
import { sendSuccess } from '../utils/response.js';

const FIXED_USER_ID = 'user_fixed_001';

const respondSchema = z.object({
  message: z.string().min(1).max(5000),
  attachmentIds: z.array(z.string()).optional().default([]),
});

export async function taskRoutes(app: FastifyInstance) {
  // GET /api/v1/tasks
  app.get('/tasks', {
    schema: { tags: ['tasks'], summary: 'List all tasks for the employee' },
  }, async (req, reply) => {
    const { status, limit } = (req.query as any);
    const tasks = await taskService.list(FIXED_USER_ID, {
      status,
      limit: limit ? parseInt(limit) : undefined,
    });
    return sendSuccess(reply, tasks);
  });

  // GET /api/v1/tasks/:taskId
  app.get('/tasks/:taskId', {
    schema: { tags: ['tasks'], summary: 'Get a specific task' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const task = await taskService.getById(taskId, FIXED_USER_ID);
    return sendSuccess(reply, task);
  });

  // POST /api/v1/tasks/:taskId/seen
  app.post('/tasks/:taskId/seen', {
    schema: { tags: ['tasks'], summary: 'Mark task as seen' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const task = await taskService.markSeen(taskId, FIXED_USER_ID);
    return sendSuccess(reply, task);
  });

  // POST /api/v1/tasks/:taskId/respond
  app.post('/tasks/:taskId/respond', {
    schema: { tags: ['tasks'], summary: 'Respond to a task (returns immediately, evaluation is async)' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const body = respondSchema.parse(req.body);
    const result = await taskService.respond(taskId, FIXED_USER_ID, body.message, body.attachmentIds);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/tasks/:taskId/ignore
  app.post('/tasks/:taskId/ignore', {
    schema: { tags: ['tasks'], summary: 'Ignore a task' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const result = await taskService.ignore(taskId, FIXED_USER_ID);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/tasks/:taskId/reject
  app.post('/tasks/:taskId/reject', {
    schema: { tags: ['tasks'], summary: 'Reject a task' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const result = await taskService.reject(taskId, FIXED_USER_ID);
    return sendSuccess(reply, result);
  });
}
