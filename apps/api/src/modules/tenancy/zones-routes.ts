import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createZoneSchema, updateZoneSchema } from '@hd-farm/shared';
import { AppError } from '../../utils/errors.js';
import { listZones, createZone, updateZone, deleteZone } from './zones-service.js';

const zonesRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOrManager = requireRole('admin', 'manager');

  fastify.get('/zones', { preHandler: verifyToken }, async (request) => {
    const { farmId } = request.query as { farmId?: string };
    if (!farmId) throw new AppError('farmId query param is required', 400, 'BAD_REQUEST');
    return listZones(fastify.db, request.user.companyId, farmId);
  });

  fastify.post('/zones', { preHandler: adminOrManager }, async (request, reply) => {
    const data = await createZoneSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    const zone = await createZone(fastify.db, request.user.companyId, data);
    return reply.status(201).send(zone);
  });

  fastify.patch('/zones/:id', { preHandler: adminOrManager }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateZoneSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    return updateZone(fastify.db, request.user.companyId, id, data);
  });

  fastify.delete('/zones/:id', { preHandler: requireRole('admin', 'manager') }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteZone(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default zonesRoutes;
