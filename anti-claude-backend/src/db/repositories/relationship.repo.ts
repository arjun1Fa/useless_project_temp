import { prisma } from '../client.js';
import { Prisma } from '@prisma/client';

export const relationshipRepo = {
  findByEmployeeId: (employeeId: string) =>
    prisma.relationshipState.findUnique({ where: { employeeId } }),

  upsert: (employeeId: string, data: Prisma.RelationshipStateUpdateInput) =>
    prisma.relationshipState.upsert({
      where: { employeeId },
      create: {
        employeeId,
        trust: (data.trust as number) ?? 50,
        respect: (data.respect as number) ?? 50,
        annoyance: (data.annoyance as number) ?? 10,
        dependence: (data.dependence as number) ?? 20,
        familiarity: (data.familiarity as number) ?? 5,
        suspicion: (data.suspicion as number) ?? 5,
      },
      update: data,
    }),

  update: (employeeId: string, data: Prisma.RelationshipStateUpdateInput) =>
    prisma.relationshipState.update({ where: { employeeId }, data }),
};
