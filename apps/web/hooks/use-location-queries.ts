import { useQuery } from '@tanstack/react-query';
import type { Farm, Zone, Pen } from '@hd-farm/shared';
import { queryKeys } from '@/lib/queries/keys';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json() as Promise<T>;
}

export function useFarmsQuery() {
  return useQuery<Farm[]>({
    queryKey: queryKeys.farms.all,
    queryFn: () => fetchJson('/api/proxy/farms'),
  });
}

export function useZonesQuery(farmId: string | undefined) {
  return useQuery<Zone[]>({
    queryKey: queryKeys.zones.byFarm(farmId ?? ''),
    queryFn: () => fetchJson(`/api/proxy/zones?farmId=${farmId}`),
    enabled: !!farmId,
  });
}

export function usePensQuery(zoneId: string | undefined) {
  return useQuery<Pen[]>({
    queryKey: queryKeys.pens.byZone(zoneId ?? ''),
    queryFn: () => fetchJson(`/api/proxy/pens?zoneId=${zoneId}`),
    enabled: !!zoneId,
  });
}
