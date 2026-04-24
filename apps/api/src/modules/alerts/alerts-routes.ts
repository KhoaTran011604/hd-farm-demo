import type { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../../plugins/auth.js';
import { getUpcomingVaccinations } from './alerts-service.js';

const alertsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/alerts/upcoming-vaccinations', { preHandler: verifyToken }, async (request) => {
    const q = request.query as { days?: string; farmId?: string };
    const days = q.days ? (parseInt(q.days, 10) || 7) : 7;
    return getUpcomingVaccinations(fastify.db, request.user.companyId, q.farmId, days);
  });
};

export default alertsRoutes;
