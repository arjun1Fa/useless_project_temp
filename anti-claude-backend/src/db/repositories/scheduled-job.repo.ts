import { prisma } from '../client.js';
import { Prisma, ScheduledJobStatus, ScheduledJobType } from '@prisma/client';

export const scheduledJobRepo = {
  create: (data: Prisma.ScheduledJobCreateInput) =>
    prisma.scheduledJob.create({ data }),

  findPending: () =>
    prisma.scheduledJob.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
      },
      orderBy: { scheduledFor: 'asc' },
    }),

  findPendingForUser: (userId: string, type?: ScheduledJobType) =>
    prisma.scheduledJob.findMany({
      where: {
        userId,
        status: 'PENDING',
        ...(type ? { type } : {}),
      },
    }),

  update: (id: string, data: Prisma.ScheduledJobUpdateInput) =>
    prisma.scheduledJob.update({ where: { id }, data }),

  updateStatus: (id: string, status: ScheduledJobStatus) =>
    prisma.scheduledJob.update({ where: { id }, data: { status } }),

  cancelUserJobs: (userId: string, type?: ScheduledJobType) =>
    prisma.scheduledJob.updateMany({
      where: { userId, status: 'PENDING', ...(type ? { type } : {}) },
      data: { status: 'CANCELLED' },
    }),
};
