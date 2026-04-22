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

export type Batch = {
  id: string;
  companyId: string;
  farmId: string;
  name: string;
  species: AnimalSpecies;
  count: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateAnimalInput = {
  name: string;
  species: AnimalSpecies;
  penId: string;
  qrCode?: string;
  typeMetadata?: Record<string, unknown>;
};

export type UpdateAnimalInput = Partial<
  Pick<CreateAnimalInput, 'name' | 'penId' | 'typeMetadata'>
> & {
  status?: HealthStatus;
};
