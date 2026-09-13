import { notificationRepo } from '../db/repositories/notification.repo.js';

export const notificationService = {
  create: async (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    taskId?: string;
  }) => notificationRepo.create({
    user: { connect: { id: data.userId } },
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId,
  }),

  list: (userId: string, unreadOnly = false) =>
    notificationRepo.findByUserId(userId, { unreadOnly, limit: 50 }),

  markRead: (id: string) => notificationRepo.markRead(id),

  markAllRead: (userId: string) => notificationRepo.markAllRead(userId),
};
