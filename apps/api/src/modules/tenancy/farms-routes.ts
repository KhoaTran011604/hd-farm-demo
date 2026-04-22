import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createFarmSchema, updateFarmSchema } from '@hd-farm/shared';
import { listFarms, getFarm, createFarm, updateFarm, deleteFarm } from './farms-service.js';

const farmsRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOrManager = requireRole('admin', 'manager');

  fastify.get('/farms', { preHandler: verifyToken }, async (request) => {
    return listFarms(fastify.db, request.user.companyId);
  });

  fastify.get('/farms/:id', { preHandler: verifyToken }, async (request) => {
    const { id } = request.params as { id: string };
    return getFarm(fastify.db, request.user.companyId, id);
  });

  fastify.post('/farms', { preHandler: adminOrManager }, async (request, reply) => {
    const data = await createFarmSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    const farm = await createFarm(fastify.db, request.user.companyId, data);
    return reply.status(201).send(farm);
  });

  fastify.patch('/farms/:id', { preHandler: adminOrManager }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateFarmSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    return updateFarm(fastify.db, request.user.companyId, id, data);
  });

  fastify.delete('/farms/:id', { preHandler: requireRole('admin') }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteFarm(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default farmsRoutes;
