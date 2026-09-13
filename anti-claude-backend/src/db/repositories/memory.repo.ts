import { prisma } from '../client.js';
import { Prisma, MemoryType } from '@prisma/client';

export const memoryRepo = {
  create: (data: Prisma.MemoryCreateInput) => prisma.memory.create({ data }),

  findByEmployeeId: (employeeId: string, opts?: { limit?: number; minImportance?: number }) =>
    prisma.memory.findMany({
      where: {
        employeeId,
        ...(opts?.minImportance ? { importance: { gte: opts.minImportance } } : {}),
      },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      take: opts?.limit ?? 20,
    }),

  countByEmployeeId: (employeeId: string) =>
    prisma.memory.count({ where: { employeeId } }),

  deleteOldest: (employeeId: string) =>
    prisma.memory.deleteMany({
      where: {
        employeeId,
        importance: { lt: 5 },
      },
    }),
};
