import type { HealthStatus, AnimalSpecies } from '@hd-farm/shared';

export interface AnimalRow {
  id: string;
  name: string;
  species: AnimalSpecies;
  status: HealthStatus;
  qrCode: string;
  farmId: string;
  penId: string | null;
  createdAt: string;
  updatedAt: string;
  pen?: { id: string; name: string; zoneId: string } | null;
  zone?: { id: string; name: string } | null;
}

export interface AnimalListResponse {
  items: AnimalRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnimalFilters {
  farmId?: string;
  zoneId?: string;
  penId?: string;
  status?: string;
  page?: number;
}

export const SPECIES_LABELS: Record<AnimalSpecies, string> = {
  heo: 'Heo',
  gà: 'Gà',
  bò: 'Bò',
};
