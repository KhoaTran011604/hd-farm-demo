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
  },
} as const;
