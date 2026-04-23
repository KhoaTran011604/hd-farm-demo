import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, type AnimalListFilters } from '@/queries/keys';
import type { Animal } from '@/lib/types';

interface AnimalListPage {
  items: (Animal & { penName?: string; zoneName?: string })[];
  nextCursor: string | null;
}

export function useAnimalsInfiniteQuery(filters: AnimalListFilters) {
  return useInfiniteQuery<AnimalListPage, Error>({
    queryKey: queryKeys.animals.list(filters),
    queryFn: ({ pageParam }) =>
      api
        .get('/animals', { params: { ...filters, cursor: pageParam as string | undefined } })
        .then((r) => r.data as AnimalListPage),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });
}

export function useAnimalsByPenQuery(penId: string, enabled = false) {
  return useQuery<{ items: (Animal & { penName?: string; zoneName?: string })[] }>({
    queryKey: queryKeys.animals.byPen(penId),
    queryFn: () =>
      api.get('/animals', { params: { penId } }).then((r) => r.data as { items: Animal[] }),
    enabled,
  });
}

export function useAnimalDetailQuery(id: string | undefined) {
  return useQuery<Animal & { penName?: string; zoneName?: string; farmName?: string }>({
    queryKey: queryKeys.animals.detail(id ?? ''),
    queryFn: () => api.get(`/animals/${id}`).then((r) => r.data),
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

export function useAnimalHealthQuery(animalId: string) {
  return useInfiniteQuery<HealthPage, Error>({
    queryKey: queryKeys.animals.health(animalId),
    queryFn: ({ pageParam }) =>
      api
        .get(`/animals/${animalId}/health`, {
          params: { cursor: pageParam as string | undefined, limit: 20 },
        })
        .then((r) => r.data as HealthPage),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!animalId,
  });
}
