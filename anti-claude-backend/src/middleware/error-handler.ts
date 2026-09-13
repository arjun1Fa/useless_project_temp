import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestId = request.id;

  // Zod validation errors
  if (error instanceof ZodError) {
    logger.warn({ requestId, issues: error.issues }, 'Validation error');
    return reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  // Known application errors
  if (error instanceof AppError) {
    logger.warn({ requestId, code: error.code, message: error.message }, 'Application error');
    return reply.status(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }

  // Fastify validation errors (schema validation)
  if ('statusCode' in error && error.statusCode === 400) {
    return reply.status(400).send({
      success: false,
      error: { code: 'BAD_REQUEST', message: error.message },
    });
  }

  // Unknown / unexpected errors
  logger.error({ requestId, err: error }, 'Unhandled error');
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.IS_PRODUCTION ? 'An unexpected error occurred' : error.message,
    },
  });
}
