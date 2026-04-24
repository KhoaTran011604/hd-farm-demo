import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

export interface VaccinationRecord {
  id: string;
  animalId: string;
  vaccineTypeId: string;
  vaccineName: string | null;
  batchNumber: string | null;
  vaccinatedById: string;
  vaccinatedAt: string;
  nextDueAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface VaccinationPage {
  items: VaccinationRecord[];
  nextCursor: string | null;
}

async function fetchAnimalVaccinations(animalId: string, cursor?: string): Promise<VaccinationPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');
  const res = await fetch(`/api/proxy/animals/${animalId}/vaccinations?${params}`);
  if (!res.ok) throw new Error('Failed to fetch vaccination records');
  return res.json() as Promise<VaccinationPage>;
}

export function useAnimalVaccinationsQuery(animalId: string) {
  return useInfiniteQuery<VaccinationPage, Error>({
    queryKey: queryKeys.animals.vaccinations(animalId),
    queryFn: ({ pageParam }) =>
      fetchAnimalVaccinations(animalId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!animalId,
  });
}
