import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dbPlugin from './plugins/db.js';
import jwtPlugin from './plugins/jwt.js';
import { errorHandler } from './plugins/error-handler.js';
import authRoutes from './modules/auth/auth-routes.js';
import usersRoutes from './modules/users/users-routes.js';
import configRoutes from './modules/config/config-routes.js';
import farmsRoutes from './modules/tenancy/farms-routes.js';
import zonesRoutes from './modules/tenancy/zones-routes.js';
import pensRoutes from './modules/tenancy/pens-routes.js';
import animalsRoutes from './modules/animals/animals-routes.js';
import dashboardRoutes from './modules/dashboard/dashboard-routes.js';
import vaccinationsRoutes from './modules/vaccinations/vaccinations-routes.js';
import diseasesRoutes from './modules/diseases/diseases-routes.js';
import treatmentsRoutes from './modules/treatments/treatments-routes.js';
import alertsRoutes from './modules/alerts/alerts-routes.js';

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
  await app.register(configRoutes);
  await app.register(farmsRoutes);
  await app.register(zonesRoutes);
  await app.register(pensRoutes);
  await app.register(animalsRoutes);
  await app.register(dashboardRoutes);
  await app.register(vaccinationsRoutes);
  await app.register(diseasesRoutes);
  await app.register(treatmentsRoutes);
  await app.register(alertsRoutes);

  return app;
}
