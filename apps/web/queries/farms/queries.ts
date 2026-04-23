import { useQuery } from '@tanstack/react-query';
import type { Farm } from '@hd-farm/shared';
import { queryKeys } from '@/queries/keys';

async function fetchFarms(): Promise<Farm[]> {
  const res = await fetch('/api/proxy/farms');
  if (!res.ok) throw new Error('Fetch failed');
  return res.json() as Promise<Farm[]>;
}

export function useFarmsQuery() {
  return useQuery<Farm[]>({
    queryKey: queryKeys.farms.all,
    queryFn: fetchFarms,
  });
}
