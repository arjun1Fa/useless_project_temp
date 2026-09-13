import { FastifyReply } from 'fastify';

export function sendSuccess(reply: FastifyReply, data: unknown, statusCode = 200) {
  return reply.status(statusCode).send({ success: true, data });
}

export function sendError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400,
) {
  return reply.status(statusCode).send({
    success: false,
    error: { code, message },
  });
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity.toUpperCase()}_NOT_FOUND`, `${entity} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 422);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}
