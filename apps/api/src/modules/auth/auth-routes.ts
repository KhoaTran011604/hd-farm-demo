import type { FastifyPluginAsync } from 'fastify';
import { loginUser, getUserById } from './auth-service.js';
import { verifyToken } from '../../plugins/auth.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request) => {
      const { email, password } = request.body as { email: string; password: string };
      const user = await loginUser(fastify.db, email, password);

      const token = fastify.jwt.sign({
        userId: user.id,
        companyId: user.companyId,
        farmId: '',
        role: user.role as 'super_admin' | 'admin' | 'manager' | 'worker',
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
      };
    }
  );

  fastify.get('/auth/me', { preHandler: verifyToken }, async (request) => {
    return getUserById(fastify.db, request.user.userId);
  });
};

export default authRoutes;
