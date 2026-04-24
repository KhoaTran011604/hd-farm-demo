import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';

export interface UpcomingVaccination {
  animalId: string;
  animalName: string;
  species: string;
  vaccineTypeId: string;
  vaccineName: string;
  dueDate: string;
}

export function useUpcomingVaccinationsQuery(days = 7) {
  return useQuery<UpcomingVaccination[]>({
    queryKey: queryKeys.alerts.upcomingVaccinations(days),
    queryFn: () =>
      api.get('/alerts/upcoming-vaccinations', { params: { days } }).then((r) => r.data),
  });
}
