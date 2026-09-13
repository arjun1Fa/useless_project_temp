import { FastifyInstance } from 'fastify';
import { messageRepo } from '../db/repositories/message.repo.js';
import { sendSuccess } from '../utils/response.js';

const FIXED_USER_ID = 'user_fixed_001';

export async function messageRoutes(app: FastifyInstance) {
  // GET /api/v1/messages
  app.get('/messages', {
    schema: { tags: ['messages'], summary: 'Get all messages for the employee' },
  }, async (req, reply) => {
    const { limit } = req.query as { limit?: string };
    const messages = await messageRepo.findByUserId(FIXED_USER_ID, limit ? parseInt(limit) : 50);
    return sendSuccess(reply, messages);
  });

  // GET /api/v1/tasks/:taskId/messages
  app.get('/tasks/:taskId/messages', {
    schema: { tags: ['messages'], summary: 'Get all messages for a specific task' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const messages = await messageRepo.findByTaskId(taskId);
    return sendSuccess(reply, messages);
  });
}
