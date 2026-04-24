import type { AnimalFilters } from '@/lib/animal-types';

export const queryKeys = {
  farms: {
    all: ['farms'] as const,
  },
  zones: {
    all: ['zones'] as const,
    byFarm: (farmId: string) => ['zones', farmId] as const,
  },
  pens: {
    all: ['pens'] as const,
    byZone: (zoneId: string) => ['pens', zoneId] as const,
  },
  animals: {
    all: ['animals'] as const,
    list: (filters: AnimalFilters) => ['animals', filters] as const,
    detail: (id: string) => ['animals', id] as const,
    byPen: (penId: string) => ['animals', 'pen', penId] as const,
    health: (id: string) => ['animals', id, 'health'] as const,
    vaccinations: (id: string) => ['animals', id, 'vaccinations'] as const,
  },
  vaccinations: {
    all: ['vaccinations'] as const,
  },
  config: {
    vaccineTypes: ['config', 'vaccine-types'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    upcomingVaccinations: (farmId?: string, days?: number) =>
      ['alerts', 'upcoming-vaccinations', farmId, days] as const,
  },
} as const;
