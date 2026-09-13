import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

// Log slow queries in development
prisma.$on('query' as never, (e: { query: string; duration: number }) => {
  if (e.duration > 500) {
    logger.warn({ query: e.query, duration: e.duration }, 'Slow query detected');
  }
});

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error({ message: e.message }, 'Prisma error');
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
