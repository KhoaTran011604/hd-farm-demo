import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors.js';

export function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ error: error.code, message: error.message });
    return;
  }

  if ('statusCode' in error && error.statusCode === 400) {
    reply.status(400).send({ error: 'VALIDATION_ERROR', message: error.message });
    return;
  }

  request.log.error(error);
  const message =
    process.env['NODE_ENV'] === 'production' ? 'Internal server error' : error.message;
  reply.status(500).send({ error: 'INTERNAL_ERROR', message });
}
