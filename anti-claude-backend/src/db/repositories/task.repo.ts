import { prisma } from '../client.js';
import { Prisma, Task, TaskStatus } from '@prisma/client';

export const taskRepo = {
  create: (data: Prisma.TaskCreateInput) => prisma.task.create({ data }),

  findById: (id: string) =>
    prisma.task.findUnique({
      where: { id },
      include: { messages: true, attachments: true, evaluation: true },
    }),

  findByUserId: (userId: string, opts?: { limit?: number; status?: TaskStatus }) =>
    prisma.task.findMany({
      where: { userId, ...(opts?.status ? { status: opts.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: opts?.limit,
      include: { evaluation: true },
    }),

  update: (id: string, data: Prisma.TaskUpdateInput) =>
    prisma.task.update({ where: { id }, data }),

  updateStatus: (id: string, status: TaskStatus, extra?: Prisma.TaskUpdateInput) =>
    prisma.task.update({ where: { id }, data: { status, ...extra } }),

  getRecentByUserId: (userId: string, limit = 5) =>
    prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        absurdityLevel: true,
        createdAt: true,
        respondedAt: true,
        deliveredAt: true,
      },
    }),
};
