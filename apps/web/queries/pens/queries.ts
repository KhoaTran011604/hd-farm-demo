import { useQuery } from '@tanstack/react-query';
import type { Pen } from '@hd-farm/shared';
import { queryKeys } from '@/queries/keys';

async function fetchPens(zoneId: string): Promise<Pen[]> {
  const res = await fetch(`/api/proxy/pens?zoneId=${zoneId}`);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json() as Promise<Pen[]>;
}

export function usePensQuery(zoneId: string | undefined) {
  return useQuery<Pen[]>({
    queryKey: queryKeys.pens.byZone(zoneId ?? ''),
    queryFn: () => fetchPens(zoneId!),
    enabled: !!zoneId,
  });
}
