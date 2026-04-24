import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createVaccinationSchema, updateVaccinationSchema } from '@hd-farm/shared';
import {
  createVaccination,
  listAnimalVaccinations,
  updateVaccination,
  deleteVaccination,
} from './vaccinations-service.js';

const vaccinationsRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOrManager = requireRole('admin', 'manager');

  fastify.post('/vaccinations', { preHandler: adminOrManager }, async (request, reply) => {
    const data = await createVaccinationSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const record = await createVaccination(fastify.db, request.user.companyId, request.user.userId, data);
    return reply.status(201).send(record);
  });

  fastify.get('/animals/:id/vaccinations', { preHandler: verifyToken }, async (request) => {
    const { id } = request.params as { id: string };
    const q = request.query as { cursor?: string; limit?: string };
    return listAnimalVaccinations(
      fastify.db,
      request.user.companyId,
      id,
      q.cursor,
      q.limit ? (parseInt(q.limit, 10) || undefined) : undefined,
    );
  });

  fastify.patch('/vaccinations/:id', { preHandler: adminOrManager }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateVaccinationSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    return updateVaccination(fastify.db, request.user.companyId, id, data);
  });

  fastify.delete('/vaccinations/:id', { preHandler: adminOrManager }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteVaccination(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default vaccinationsRoutes;
