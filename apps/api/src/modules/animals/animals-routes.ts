import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createAnimalSchema, updateAnimalSchema, updateAnimalStatusSchema } from '@hd-farm/shared';
import type { AnimalSpecies } from '@hd-farm/shared';
import {
  listAnimals,
  getAnimalById,
  getAnimalByQr,
  createAnimal,
  updateAnimal,
  updateAnimalStatus,
  softDeleteAnimal,
} from './animals-service.js';

const animalsRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOrManager = requireRole('admin', 'manager');
  const managerOrWorker = requireRole('admin', 'manager', 'worker');

  fastify.get('/animals', { preHandler: verifyToken }, async (request) => {
    const q = request.query as {
      farmId?: string; zoneId?: string; penId?: string;
      status?: string; cursor?: string; limit?: string;
    };
    return listAnimals(fastify.db, request.user.companyId, {
      farmId: q.farmId,
      zoneId: q.zoneId,
      penId: q.penId,
      status: q.status,
      cursor: q.cursor,
      limit: q.limit ? (parseInt(q.limit, 10) || undefined) : undefined,
    });
  });

  // static segment must be registered before :id to avoid shadowing
  fastify.get('/animals/by-qr/:uuid', { preHandler: verifyToken }, async (request) => {
    const { uuid } = request.params as { uuid: string };
    return getAnimalByQr(fastify.db, request.user.companyId, uuid);
  });

  fastify.get('/animals/:id', { preHandler: verifyToken }, async (request) => {
    const { id } = request.params as { id: string };
    return getAnimalById(fastify.db, request.user.companyId, id);
  });

  fastify.post('/animals', { preHandler: adminOrManager }, async (request, reply) => {
    const raw = await createAnimalSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    const data = { ...raw, species: raw.species as AnimalSpecies };
    const animal = await createAnimal(fastify.db, request.user.companyId, data);
    return reply.status(201).send(animal);
  });

  fastify.patch('/animals/:id', { preHandler: adminOrManager }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateAnimalSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    return updateAnimal(fastify.db, request.user.companyId, id, data);
  });

  fastify.patch('/animals/:id/status', { preHandler: managerOrWorker }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateAnimalStatusSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
    return updateAnimalStatus(fastify.db, request.user.companyId, id, request.user.userId, data);
  });

  fastify.delete('/animals/:id', { preHandler: adminOrManager }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await softDeleteAnimal(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default animalsRoutes;
