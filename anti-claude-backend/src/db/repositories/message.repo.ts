import { prisma } from '../client.js';
import { Prisma, SenderType } from '@prisma/client';

export const messageRepo = {
  create: (data: Prisma.MessageCreateInput) => prisma.message.create({ data }),

  findByTaskId: (taskId: string) =>
    prisma.message.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { attachments: true },
    }),

  findByUserId: (userId: string, limit = 50) =>
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { attachments: true },
    }),

  getRecentByUserId: (userId: string, limit = 10) =>
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        senderType: true,
        content: true,
        taskId: true,
        createdAt: true,
      },
    }),
};
