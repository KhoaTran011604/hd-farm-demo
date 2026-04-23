import { useQuery } from '@tanstack/react-query';
import type { Zone } from '@hd-farm/shared';
import { queryKeys } from '@/queries/keys';

async function fetchZones(farmId: string): Promise<Zone[]> {
  const res = await fetch(`/api/proxy/zones?farmId=${farmId}`);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json() as Promise<Zone[]>;
}

export function useZonesQuery(farmId: string | undefined) {
  return useQuery<Zone[]>({
    queryKey: queryKeys.zones.byFarm(farmId ?? ''),
    queryFn: () => fetchZones(farmId!),
    enabled: !!farmId,
  });
}
