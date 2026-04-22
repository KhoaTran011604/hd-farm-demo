import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dbPlugin from './plugins/db.js';
import jwtPlugin from './plugins/jwt.js';
import { errorHandler } from './plugins/error-handler.js';
import authRoutes from './modules/auth/auth-routes.js';
import usersRoutes from './modules/users/users-routes.js';

export async function buildServer() {
  const app = Fastify({ logger: process.env['NODE_ENV'] !== 'test' });

  await app.register(cors, {
    origin: [
      process.env['WEB_ORIGIN'] ?? 'http://localhost:5173',
      process.env['MOBILE_ORIGIN'] ?? 'http://localhost:8081',
    ],
  });
  await app.register(helmet);
  await app.register(dbPlugin);
  await app.register(jwtPlugin);

  app.setErrorHandler(errorHandler);

  app.get('/health', async () => ({ status: 'ok', service: 'api' }));

  await app.register(authRoutes);
  await app.register(usersRoutes);

  return app;
}
