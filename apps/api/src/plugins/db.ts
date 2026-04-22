import fp from 'fastify-plugin';
import { db } from '@hd-farm/db';
import type { Database } from '@hd-farm/db';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('db', db);
};

export default fp(dbPlugin, { name: 'db' });
