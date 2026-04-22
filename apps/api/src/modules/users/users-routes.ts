import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../plugins/auth.js';
import { listUsers, createUser, updateUser, deleteUser } from './users-service.js';
import type { UserRole } from '@hd-farm/shared';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOnly = requireRole('admin');

  fastify.get('/users', { preHandler: adminOnly }, async (request) => {
    const { limit: limitStr, cursor } = request.query as { limit?: string; cursor?: string };
    const limitParsed = limitStr ? parseInt(limitStr, 10) : undefined;
    const limit = limitParsed !== undefined && !isNaN(limitParsed) ? limitParsed : undefined;
    return listUsers(fastify.db, request.user.companyId, { limit, cursor });
  });

  fastify.post(
    '/users',
    {
      preHandler: adminOnly,
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string', minLength: 2, maxLength: 100 },
            role: { type: 'string', enum: ['admin', 'manager', 'worker'] },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        email: string;
        password: string;
        name: string;
        role?: UserRole;
      };
      const user = await createUser(fastify.db, request.user.companyId, body);
      return reply.status(201).send(user);
    }
  );

  fastify.patch(
    '/users/:id',
    {
      preHandler: adminOnly,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            role: { type: 'string', enum: ['admin', 'manager', 'worker'] },
          },
        },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { name?: string; role?: UserRole };
      return updateUser(fastify.db, request.user.companyId, id, body);
    }
  );

  fastify.delete('/users/:id', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteUser(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default usersRoutes;
