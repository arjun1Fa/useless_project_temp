import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './db/client.js';
import { createRealtimeGateway } from './events/realtime.gateway.js';
import { startScheduler } from './scheduler/scheduler.service.js';

async function main() {
  logger.info('🚀 Starting Anti-Claude backend...');

  // Validate DB connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error({ err }, '❌ Failed to connect to database');
    process.exit(1);
  }

  const app = await buildApp();

  // Fastify's underlying Node.js HTTP server (Socket.IO attaches to this)
  const httpServer = app.server;

  // Start Socket.IO realtime gateway
  const io = createRealtimeGateway(httpServer);
  logger.info('✅ Realtime gateway initialized');

  // Start cron scheduler
  startScheduler();
  logger.info('✅ Scheduler started');

  // Start listening via Fastify
  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  logger.info(`✅ Server listening on http://0.0.0.0:${env.PORT}`);
  logger.info(`📚 API docs available at http://localhost:${env.PORT}/docs`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    await app.close();
    await prisma.$disconnect();
    io.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
