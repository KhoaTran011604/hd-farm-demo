import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createTreatmentSchema, updateTreatmentSchema } from '@hd-farm/shared';
import {
  createTreatment,
  listDiseaseTreatments,
  listAnimalTreatments,
  updateTreatment,
  deleteTreatment,
} from './treatments-service.js';

const treatmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Only manager + admin can modify treatments (workers cannot; vet role not implemented yet)
  const medicalWrite = requireRole('admin', 'manager');

  fastify.post('/treatments', { preHandler: medicalWrite }, async (request, reply) => {
    const data = await createTreatmentSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const record = await createTreatment(
      fastify.db,
      request.user.companyId,
      request.user.userId,
      data,
    );
    return reply.status(201).send(record);
  });

  fastify.get(
    '/diseases/:diseaseId/treatments',
    { preHandler: verifyToken },
    async (request) => {
      const { diseaseId } = request.params as { diseaseId: string };
      return listDiseaseTreatments(fastify.db, request.user.companyId, diseaseId);
    },
  );

  fastify.get(
    '/animals/:id/treatments',
    { preHandler: verifyToken },
    async (request) => {
      const { id } = request.params as { id: string };
      const q = request.query as { cursor?: string; limit?: string };
      return listAnimalTreatments(
        fastify.db,
        request.user.companyId,
        id,
        q.cursor,
        q.limit ? parseInt(q.limit, 10) || undefined : undefined,
      );
    },
  );

  fastify.patch('/treatments/:id', { preHandler: medicalWrite }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateTreatmentSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    return updateTreatment(fastify.db, request.user.companyId, id, data);
  });

  fastify.delete('/treatments/:id', { preHandler: medicalWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteTreatment(fastify.db, request.user.companyId, id);
    return reply.status(204).send();
  });
};

export default treatmentsRoutes;
