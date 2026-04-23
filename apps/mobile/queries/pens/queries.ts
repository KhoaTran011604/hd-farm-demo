import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';
import type { Pen } from '@/lib/types';

export function usePensQuery(zoneId: string | null | undefined) {
  return useQuery<Pen[]>({
    queryKey: queryKeys.pens.byZone(zoneId ?? ''),
    queryFn: () => api.get('/pens', { params: { zoneId } }).then((r) => r.data as Pen[]),
    enabled: !!zoneId,
  });
}
