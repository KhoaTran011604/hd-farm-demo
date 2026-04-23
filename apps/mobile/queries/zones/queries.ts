import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';
import type { Zone } from '@/lib/types';

export function useZonesQuery(farmId: string | null | undefined) {
  return useQuery<Zone[]>({
    queryKey: queryKeys.zones.byFarm(farmId ?? ''),
    queryFn: () => api.get('/zones', { params: { farmId } }).then((r) => r.data as Zone[]),
    enabled: !!farmId,
  });
}
