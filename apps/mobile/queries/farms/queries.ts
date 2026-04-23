import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';
import type { Farm } from '@/lib/types';

export function useFarmsQuery() {
  return useQuery<Farm[]>({
    queryKey: queryKeys.farms.all,
    queryFn: () => api.get('/farms').then((r) => r.data as Farm[]),
  });
}
