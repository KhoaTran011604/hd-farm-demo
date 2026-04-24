import type { FastifyPluginAsync } from 'fastify';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { createDiseaseSchema, updateDiseaseSchema } from '@hd-farm/shared';
import type { DiseaseSeverity } from '@hd-farm/shared';
import {
  createDisease,
  listAnimalDiseases,
  updateDisease,
  getActiveWithdrawals,
} from './diseases-service.js';

const diseasesRoutes: FastifyPluginAsync = async (fastify) => {
  // worker + manager + admin can REPORT a disease (create)
  const anyAuthed = requireRole('admin', 'manager', 'worker');
  // only manager + admin can update/resolve (vet role not implemented yet)
  const medicalWrite = requireRole('admin', 'manager');

  fastify.post('/diseases', { preHandler: anyAuthed }, async (request, reply) => {
    const data = await createDiseaseSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    const record = await createDisease(
      fastify.db,
      request.user.companyId,
      request.user.userId,
      { ...data, severity: data.severity as DiseaseSeverity },
    );
    return reply.status(201).send(record);
  });

  fastify.get('/animals/:id/diseases', { preHandler: verifyToken }, async (request) => {
    const { id } = request.params as { id: string };
    const q = request.query as { cursor?: string; limit?: string };
    return listAnimalDiseases(
      fastify.db,
      request.user.companyId,
      id,
      q.cursor,
      q.limit ? parseInt(q.limit, 10) || undefined : undefined,
    );
  });

  fastify.patch('/diseases/:id', { preHandler: medicalWrite }, async (request) => {
    const { id } = request.params as { id: string };
    const data = await updateDiseaseSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    return updateDisease(fastify.db, request.user.companyId, request.user.userId, id, {
      ...data,
      severity: data.severity as DiseaseSeverity | undefined,
    });
  });

  fastify.get(
    '/animals/:id/withdrawals',
    { preHandler: verifyToken },
    async (request) => {
      const { id } = request.params as { id: string };
      return getActiveWithdrawals(fastify.db, request.user.companyId, id);
    },
  );
};

export default diseasesRoutes;
