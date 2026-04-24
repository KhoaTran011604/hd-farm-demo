import type { FastifyPluginAsync } from 'fastify';
import { verifyToken } from '../../plugins/auth.js';
import { getUpcomingVaccinations } from './alerts-service.js';

const alertsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/alerts/upcoming-vaccinations', { preHandler: verifyToken }, async (request) => {
    const q = request.query as { days?: string; farmId?: string; limit?: string; offset?: string };
    const days = q.days ? (parseInt(q.days, 10) || 7) : 7;
    const limit = q.limit ? (parseInt(q.limit, 10) || 200) : 200;
    const offset = q.offset ? (parseInt(q.offset, 10) || 0) : 0;
    return getUpcomingVaccinations(fastify.db, request.user.companyId, q.farmId, days, limit, offset);
  });
};

export default alertsRoutes;
