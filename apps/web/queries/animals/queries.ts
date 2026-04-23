import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { AnimalFilters, AnimalListResponse } from '@/lib/animal-types';
import type { Animal } from '@hd-farm/shared';
import { queryKeys } from '@/queries/keys';

async function fetchAnimals(filters: AnimalFilters): Promise<AnimalListResponse> {
  const params = new URLSearchParams();
  if (filters.farmId) params.set('farmId', filters.farmId);
  if (filters.zoneId) params.set('zoneId', filters.zoneId);
  if (filters.penId) params.set('penId', filters.penId);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page ?? 1));
  const res = await fetch(`/api/proxy/animals?${params}`);
  if (!res.ok) throw new Error('Failed to fetch animals');
  return res.json() as Promise<AnimalListResponse>;
}

export function useAnimalsQuery(filters: AnimalFilters, initialData?: AnimalListResponse) {
  return useQuery<AnimalListResponse>({
    queryKey: queryKeys.animals.list(filters),
    queryFn: () => fetchAnimals(filters),
    initialData: !filters.farmId && !filters.status && !filters.page ? initialData : undefined,
  });
}

export function useAnimalsByPenQuery(penId: string, enabled = false) {
  return useQuery<{ items: (Animal & { penName?: string; zoneName?: string })[] }>({
    queryKey: queryKeys.animals.byPen(penId),
    queryFn: async () => {
      const res = await fetch(`/api/proxy/animals?penId=${penId}`);
      if (!res.ok) throw new Error('Failed to fetch animals by pen');
      return res.json() as Promise<{ items: (Animal & { penName?: string; zoneName?: string })[] }>;
    },
    enabled,
  });
}

export function useAnimalDetailQuery(id: string | undefined) {
  return useQuery<Animal & { penName?: string; zoneName?: string; farmName?: string }>({
    queryKey: queryKeys.animals.detail(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/proxy/animals/${id}`);
      if (!res.ok) throw new Error('Failed to fetch animal');
      return res.json() as Promise<Animal & { penName?: string; zoneName?: string; farmName?: string }>;
    },
    enabled: !!id,
  });
}

export interface HealthRecord {
  id: string;
  animalId: string;
  checkerId: string;
  status: string | null;
  weightKg: string | null;
  notes: string | null;
  checkedAt: string;
  createdAt: string;
}

interface HealthPage {
  items: HealthRecord[];
  nextCursor: string | null;
}

async function fetchAnimalHealth(animalId: string, cursor?: string): Promise<HealthPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');
  const res = await fetch(`/api/proxy/animals/${animalId}/health?${params}`);
  if (!res.ok) throw new Error('Failed to fetch health records');
  return res.json() as Promise<HealthPage>;
}

export function useAnimalHealthQuery(animalId: string) {
  return useInfiniteQuery<HealthPage, Error>({
    queryKey: queryKeys.animals.health(animalId),
    queryFn: ({ pageParam }) => fetchAnimalHealth(animalId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!animalId,
  });
}
