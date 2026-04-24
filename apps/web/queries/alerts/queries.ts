import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

export interface UpcomingVaccination {
  animalId: string;
  animalName: string;
  species: string;
  vaccineTypeId: string;
  vaccineName: string;
  dueDate: string;
}

async function fetchUpcomingVaccinations(
  farmId?: string,
  days = 7
): Promise<UpcomingVaccination[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (farmId) params.set('farmId', farmId);
  const res = await fetch(`/api/proxy/alerts/upcoming-vaccinations?${params}`);
  if (!res.ok) throw new Error('Failed to fetch upcoming vaccinations');
  return res.json() as Promise<UpcomingVaccination[]>;
}

export function useUpcomingVaccinationsQuery(farmId?: string, days = 7) {
  return useQuery<UpcomingVaccination[]>({
    queryKey: queryKeys.alerts.upcomingVaccinations(farmId, days),
    queryFn: () => fetchUpcomingVaccinations(farmId, days),
  });
}
