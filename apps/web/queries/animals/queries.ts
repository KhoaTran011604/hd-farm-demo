import { useQuery } from '@tanstack/react-query';
import type { AnimalFilters, AnimalListResponse } from '@/lib/animal-types';
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
