import { and, eq, isNull } from 'drizzle-orm';
import { users } from '@hd-farm/db';
import { verifyPassword } from '../../utils/password.js';
import { AppError } from '../../utils/errors.js';
import type { Database } from '@hd-farm/db';

export async function loginUser(db: Database, email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || user.deletedAt !== null) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  return user;
}

export async function getUserById(db: Database, userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      companyId: users.companyId,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  return user;
}
