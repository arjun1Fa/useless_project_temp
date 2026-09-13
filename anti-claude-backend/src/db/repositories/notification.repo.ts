import { prisma } from '../client.js';
import { Prisma } from '@prisma/client';

export const notificationRepo = {
  create: (data: Prisma.NotificationCreateInput) => prisma.notification.create({ data }),

  findByUserId: (userId: string, opts?: { unreadOnly?: boolean; limit?: number }) =>
    prisma.notification.findMany({
      where: { userId, ...(opts?.unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: opts?.limit ?? 50,
    }),

  markRead: (id: string) => prisma.notification.update({ where: { id }, data: { read: true } }),

  markAllRead: (userId: string) =>
    prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } }),
};
