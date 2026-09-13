import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { v4 as uuidv4 } from 'uuid';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestIdHook } from './middleware/request-id.js';
import { logger } from './utils/logger.js';

// Routes
import { healthRoutes } from './routes/health.routes.js';
import { employeeRoutes } from './routes/employee.routes.js';
import { taskRoutes } from './routes/task.routes.js';
import { messageRoutes } from './routes/message.routes.js';
import { attachmentRoutes } from './routes/attachment.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { adminRoutes } from './routes/admin.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use our own pino logger
    requestIdHeader: 'x-request-id',
    genReqId: () => uuidv4(),
  });

  // ─── Hooks ───────────────────────────────────────────────────────────────
  app.addHook('onRequest', requestIdHook);

  app.addHook('onResponse', (request, reply, done) => {
    logger.info({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: Math.round(reply.elapsedTime),
    }, 'request completed');
    done();
  });

  // ─── Plugins ─────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Retry after ${context.after}`,
      },
    }),
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // ─── OpenAPI / Swagger ────────────────────────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Anti-Claude API',
        description: 'Backend API for the Anti-Claude AI boss system',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
      tags: [
        { name: 'health', description: 'Health check' },
        { name: 'employee', description: 'Employee profile & stats' },
        { name: 'tasks', description: 'Task lifecycle' },
        { name: 'messages', description: 'Conversation messages' },
        { name: 'attachments', description: 'File/image uploads' },
        { name: 'notifications', description: 'Notifications' },
        { name: 'admin', description: 'Admin & demo controls' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // ─── Error Handler ────────────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ─── Routes ──────────────────────────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(employeeRoutes, { prefix: '/api/v1' });
  await app.register(taskRoutes, { prefix: '/api/v1' });
  await app.register(messageRoutes, { prefix: '/api/v1' });
  await app.register(attachmentRoutes, { prefix: '/api/v1' });
  await app.register(notificationRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  return app;
}
