export type AnimalSpecies = 'heo' | 'gà' | 'bò';

export type HealthStatus =
  | 'healthy'
  | 'monitoring'
  | 'sick'
  | 'quarantine'
  | 'recovered'
  | 'dead'
  | 'sold';

export type Animal = {
  id: string;
  companyId: string;
  farmId: string;
  penId: string | null;
  name: string;
  species: AnimalSpecies;
  status: HealthStatus;
  qrCode: string;
  typeMetadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

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

export type Farm = {
  id: string;
  companyId: string;
  name: string;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Zone = {
  id: string;
  companyId: string;
  farmId: string;
  name: string;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Pen = {
  id: string;
  companyId: string;
  farmId: string;
  zoneId: string;
  name: string;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
