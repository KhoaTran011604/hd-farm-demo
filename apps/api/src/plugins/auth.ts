import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@hd-farm/shared';
import { AppError } from '../utils/errors.js';

export async function verifyToken(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await verifyToken(request, reply);
    if (!roles.includes(request.user.role)) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
  };
}
