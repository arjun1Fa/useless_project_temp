import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Basic health check',
      response: { 200: { type: 'object' } },
    },
  }, async (_req, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/v1/health', {
    schema: { tags: ['health'], summary: 'Detailed health check' },
  }, async (_req, reply) => {
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    return reply.send({
      success: true,
      data: {
        status: dbStatus === 'ok' ? 'healthy' : 'degraded',
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  });
}
