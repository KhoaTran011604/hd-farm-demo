import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../../plugins/auth.js';
import { getWorkerTasks, getManagerOverview } from './dashboard-service.js';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/dashboard/my-tasks',
    { preHandler: requireRole('admin', 'manager', 'worker') },
    async (request) => {
      return getWorkerTasks(fastify.db, request.user.companyId);
    }
  );

  fastify.get(
    '/dashboard/overview',
    { preHandler: requireRole('admin', 'manager') },
    async (request) => {
      return getManagerOverview(fastify.db, request.user.companyId);
    }
  );
};

export default dashboardRoutes;
