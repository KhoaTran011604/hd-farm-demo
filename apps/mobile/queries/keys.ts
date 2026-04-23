export type AnimalListFilters = {
  penId?: string;
  zoneId?: string;
  farmId?: string;
  status?: string;
};

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
    list: (filters: AnimalListFilters) => ['animals', 'list', filters] as const,
    byPen: (penId: string) => ['animals', 'pen', penId] as const,
    detail: (id: string) => ['animals', id] as const,
  },
  dashboard: {
    tasks: ['dashboard', 'tasks'] as const,
    overview: ['dashboard', 'overview'] as const,
  },
} as const;
