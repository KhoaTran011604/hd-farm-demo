export type UserRole = 'super_admin' | 'admin' | 'manager' | 'worker';

export type User = {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type UserFarmRole = {
  id: string;
  userId: string;
  farmId: string;
  role: 'manager' | 'worker';
  createdAt: Date;
};

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthTokenPayload = {
  userId: string;
  companyId: string;
  farmId: string;
  role: UserRole;
};
