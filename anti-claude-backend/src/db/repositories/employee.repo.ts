import { prisma } from '../client.js';
import { Prisma } from '@prisma/client';

export const employeeRepo = {
  findByUserId: (userId: string) =>
    prisma.employeeProfile.findUnique({
      where: { userId },
      include: {
        settings: true,
        relationshipState: true,
        promotions: { orderBy: { createdAt: 'desc' } },
      },
    }),

  findById: (id: string) =>
    prisma.employeeProfile.findUnique({
      where: { id },
      include: { settings: true, relationshipState: true },
    }),

  update: (userId: string, data: Prisma.EmployeeProfileUpdateInput) =>
    prisma.employeeProfile.update({ where: { userId }, data }),

  updateSettings: (userId: string, data: Prisma.EmployeeSettingsUpdateInput) =>
    prisma.employeeSettings.update({ where: { userId }, data }),

  incrementStats: (
    userId: string,
    field: 'tasksCompleted' | 'tasksIgnored' | 'tasksRejected' | 'tasksFailed' | 'totalInteractions',
  ) =>
    prisma.employeeProfile.update({
      where: { userId },
      data: { [field]: { increment: 1 } },
    }),
};
