import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import type { ObjectSchema } from 'yup';
import { requireRole, verifyToken } from '../../plugins/auth.js';
import { AppError } from '../../utils/errors.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

/**
 * DRY factory for config reference table CRUD.
 * GET (all authenticated), POST/PATCH (admin|manager), DELETE (admin only).
 */
export function createConfigRoutes(
  prefix: string,
  table: AnyTable,
  createSchema: ObjectSchema<any>,
  updateSchema: ObjectSchema<any>
): FastifyPluginAsync {
  const adminOrManager = requireRole('admin', 'manager');

  return async (fastify) => {
    fastify.get(`/${prefix}`, { preHandler: verifyToken }, async () => {
      return fastify.db.select().from(table);
    });

    fastify.post(`/${prefix}`, { preHandler: adminOrManager }, async (request, reply) => {
      const data = await createSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
      const [item] = await fastify.db.insert(table).values(data).returning();
      return reply.status(201).send(item);
    });

    fastify.patch(`/${prefix}/:id`, { preHandler: adminOrManager }, async (request) => {
      const { id } = request.params as { id: string };
      const [existing] = await fastify.db.select().from(table).where(eq(table.id, id)).limit(1);
      if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');
      const data = await updateSchema.validate(request.body, { abortEarly: false, stripUnknown: true });
      const [updated] = await fastify.db.update(table).set(data).where(eq(table.id, id)).returning();
      return updated;
    });

    fastify.delete(`/${prefix}/:id`, { preHandler: requireRole('admin') }, async (request, reply) => {
      const { id } = request.params as { id: string };
      const [existing] = await fastify.db.select().from(table).where(eq(table.id, id)).limit(1);
      if (!existing) throw new AppError('Not found', 404, 'NOT_FOUND');
      await fastify.db.delete(table).where(eq(table.id, id));
      return reply.status(204).send();
    });
  };
}
