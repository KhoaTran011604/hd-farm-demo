import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';

export interface DiseaseTypeOption {
  id: string;
  name: string;
  species: string | null;
}

export function useDiseaseTypesQuery() {
  return useQuery<DiseaseTypeOption[]>({
    queryKey: queryKeys.config.diseaseTypes,
    queryFn: () => api.get('/config/disease-types').then((r) => r.data as DiseaseTypeOption[]),
  });
}
