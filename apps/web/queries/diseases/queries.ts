import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

export interface DiseaseRecord {
  id: string;
  animalId: string;
  diseaseTypeId: string | null;
  diseaseName: string | null;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms: string | null;
  notes: string | null;
  recordedById: string | null;
  diagnosedAt: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface TreatmentRecord {
  id: string;
  animalId: string;
  diseaseRecordId: string | null;
  medicine: string;
  dosage: string | null;
  withdrawalDays: number | null;
  treatedById: string;
  treatedAt: string;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ActiveWithdrawal {
  medicine: string;
  withdrawalEndAt: string;
}

interface DiseasePage {
  items: DiseaseRecord[];
  nextCursor: string | null;
}

async function fetchAnimalDiseases(animalId: string, cursor?: string): Promise<DiseasePage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');
  const res = await fetch(`/api/proxy/animals/${animalId}/diseases?${params}`);
  if (!res.ok) throw new Error('Failed to fetch diseases');
  return res.json() as Promise<DiseasePage>;
}

export function useAnimalDiseasesQuery(animalId: string) {
  return useInfiniteQuery<DiseasePage, Error>({
    queryKey: queryKeys.animals.diseases(animalId),
    queryFn: ({ pageParam }) => fetchAnimalDiseases(animalId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!animalId,
  });
}

export function useDiseaseTreatmentsQuery(diseaseId: string) {
  return useQuery<{ items: TreatmentRecord[] }, Error>({
    queryKey: queryKeys.diseases.treatments(diseaseId),
    queryFn: async () => {
      const res = await fetch(`/api/proxy/diseases/${diseaseId}/treatments`);
      if (!res.ok) throw new Error('Failed to fetch treatments');
      return res.json() as Promise<{ items: TreatmentRecord[] }>;
    },
    enabled: !!diseaseId,
  });
}

export function useAnimalWithdrawalsQuery(animalId: string) {
  return useQuery<ActiveWithdrawal[], Error>({
    queryKey: queryKeys.animals.withdrawals(animalId),
    queryFn: async () => {
      const res = await fetch(`/api/proxy/animals/${animalId}/withdrawals`);
      if (!res.ok) throw new Error('Failed to fetch withdrawals');
      return res.json() as Promise<ActiveWithdrawal[]>;
    },
    enabled: !!animalId,
  });
}
