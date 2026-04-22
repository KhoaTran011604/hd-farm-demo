import { eq, and, isNull, gt } from 'drizzle-orm';
import { users } from '@hd-farm/db';
import { hashPassword } from '../../utils/password.js';
import { paginate, type PaginationParams } from '../../utils/pagination.js';
import { AppError } from '../../utils/errors.js';
import { PAGE_SIZE, MAX_PAGE_SIZE, type UserRole } from '@hd-farm/shared';
import type { Database } from '@hd-farm/db';

const USER_FIELDS = {
  id: users.id,
  companyId: users.companyId,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
};

export async function listUsers(db: Database, companyId: string, params: PaginationParams) {
  const limit = Math.min(params.limit ?? PAGE_SIZE, MAX_PAGE_SIZE);

  const baseWhere = and(eq(users.companyId, companyId), isNull(users.deletedAt));
  const whereClause = params.cursor
    ? and(baseWhere, gt(users.createdAt, new Date(params.cursor)))
    : baseWhere;

  const items = await db
    .select(USER_FIELDS)
    .from(users)
    .where(whereClause)
    .orderBy(users.createdAt)
    .limit(limit + 1);

  return paginate(items, limit, (item) => item.createdAt.toISOString());
}

export async function createUser(
  db: Database,
  companyId: string,
  data: { email: string; password: string; name: string; role?: UserRole }
) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) throw new AppError('Email already in use', 409, 'EMAIL_CONFLICT');

  const passwordHash = await hashPassword(data.password);
  const [user] = await db
    .insert(users)
    .values({ companyId, email: data.email, passwordHash, name: data.name, role: data.role ?? 'worker' })
    .returning(USER_FIELDS);

  return user;
}

export async function updateUser(
  db: Database,
  companyId: string,
  userId: string,
  data: { name?: string; role?: UserRole }
) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.companyId, companyId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) throw new AppError('User not found', 404, 'NOT_FOUND');

  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role, updatedAt: users.updatedAt });

  return updated;
}

export async function deleteUser(db: Database, companyId: string, userId: string) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.companyId, companyId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) throw new AppError('User not found', 404, 'NOT_FOUND');

  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));
}
