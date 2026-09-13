import { prisma } from '../client.js';
import { Prisma } from '@prisma/client';

export const eventRepo = {
  create: (data: Prisma.EventCreateInput) => prisma.event.create({ data }),

  findByUserId: (userId: string, limit = 50) =>
    prisma.event.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),

  findAll: (limit = 100) =>
    prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
};
