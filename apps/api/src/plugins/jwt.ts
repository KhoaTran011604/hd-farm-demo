import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import type { FastifyPluginAsync } from 'fastify';
import type { AuthTokenPayload } from '@hd-farm/shared';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not set');

  await fastify.register(fjwt, {
    secret,
    sign: { expiresIn: '24h' },
  });
};

export default fp(jwtPlugin, { name: 'jwt' });
