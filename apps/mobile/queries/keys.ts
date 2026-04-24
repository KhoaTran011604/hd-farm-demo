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
    health: (id: string) => ['animals', id, 'health'] as const,
  },
  dashboard: {
    tasks: ['dashboard', 'tasks'] as const,
    overview: ['dashboard', 'overview'] as const,
  },
  vaccinations: {
    byAnimal: (animalId: string) => ['vaccinations', 'animal', animalId] as const,
  },
  diseases: {
    byAnimal: (animalId: string) => ['diseases', 'animal', animalId] as const,
    treatments: (diseaseId: string) => ['diseases', diseaseId, 'treatments'] as const,
    withdrawalsByAnimal: (animalId: string) => ['withdrawals', 'animal', animalId] as const,
  },
  config: {
    vaccineTypes: ['config', 'vaccine-types'] as const,
    diseaseTypes: ['config', 'disease-types'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    upcomingVaccinations: (days?: number) => ['alerts', 'upcoming-vaccinations', days] as const,
    upcomingVaccinationsPagination: (days?: number) => ['alerts', 'upcoming-vaccinations-pagination', days] as const,
  },
} as const;
