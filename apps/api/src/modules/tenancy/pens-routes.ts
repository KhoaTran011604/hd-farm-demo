import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createPenSchema, updatePenSchema } from '@hd-farm/shared';
import { AppError } from '../../utils/errors.js';
import { listPens, createPen, updatePen, deletePen } from './pens-service.js';

const pensRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOrManager = requireRole('admin', 'manager');

  fastify.get('/pens', { preHandler: verifyToken }, async (request) => {
    const { zoneId } = request.query as { zoneId?: string };
    if (!zoneId) throw new AppError('zoneId query param is required', 400, 'BAD_REQUEST');
    return listPens(fastify.db, request.user.companyId, zoneId);
  });

  fastify.post('/pens', { preHandler: adminOrManager }, async (request, reply) => {
    const data = await createPenSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    const pen = await createPen(fastify.db, request.user.companyId, data);
    return reply.status(201).send(pen);
  });

  fastify.patch('/pens/:id', { preHandler: adminOrManager }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updatePenSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    return updatePen(fastify.db, request.user.companyId, id, data);
  });

  fastify.delete('/pens/:id', { preHandler: adminOrManager }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deletePen(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default pensRoutes;
