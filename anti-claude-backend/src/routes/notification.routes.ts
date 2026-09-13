import { FastifyInstance } from 'fastify';
import { notificationService } from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.js';

const FIXED_USER_ID = 'user_fixed_001';

export async function notificationRoutes(app: FastifyInstance) {
  // GET /api/v1/notifications
  app.get('/notifications', {
    schema: { tags: ['notifications'], summary: 'List notifications' },
  }, async (req, reply) => {
    const { unreadOnly } = req.query as { unreadOnly?: string };
    const notifications = await notificationService.list(FIXED_USER_ID, unreadOnly === 'true');
    return sendSuccess(reply, notifications);
  });

  // POST /api/v1/notifications/:id/read
  app.post('/notifications/:id/read', {
    schema: { tags: ['notifications'], summary: 'Mark a notification as read' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const notification = await notificationService.markRead(id);
    return sendSuccess(reply, notification);
  });

  // POST /api/v1/notifications/read-all
  app.post('/notifications/read-all', {
    schema: { tags: ['notifications'], summary: 'Mark all notifications as read' },
  }, async (_req, reply) => {
    await notificationService.markAllRead(FIXED_USER_ID);
    return sendSuccess(reply, { message: 'All notifications marked as read' });
  });
}
