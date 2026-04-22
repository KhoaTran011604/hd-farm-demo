'use client';

import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AnimalFilters } from '@/lib/animal-types';
import type { Farm, Zone, Pen } from '@hd-farm/shared';

const HEALTH_STATUSES = [
  { value: 'healthy', label: 'Khỏe mạnh' },
  { value: 'monitoring', label: 'Theo dõi' },
  { value: 'sick', label: 'Bệnh' },
  { value: 'quarantine', label: 'Cách ly' },
  { value: 'recovered', label: 'Đã hồi phục' },
  { value: 'dead', label: 'Chết' },
  { value: 'sold', label: 'Đã bán' },
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json() as Promise<T>;
}

interface AnimalFiltersProps {
  filters: AnimalFilters;
  onChange: (updated: Partial<AnimalFilters>) => void;
}

export function AnimalFilters({ filters, onChange }: AnimalFiltersProps): React.JSX.Element {
  const { data: farms = [] } = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: () => fetchJson('/api/proxy/farms'),
  });

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones', filters.farmId],
    queryFn: () => fetchJson(`/api/proxy/zones?farmId=${filters.farmId}`),
    enabled: !!filters.farmId,
  });

  const { data: pens = [] } = useQuery<Pen[]>({
    queryKey: ['pens', filters.zoneId],
    queryFn: () => fetchJson(`/api/proxy/pens?zoneId=${filters.zoneId}`),
    enabled: !!filters.zoneId,
  });

  function handleFarmChange(val: string): void {
    onChange({ farmId: val === 'all' ? undefined : val, zoneId: undefined, penId: undefined });
  }

  function handleZoneChange(val: string): void {
    onChange({ zoneId: val === 'all' ? undefined : val, penId: undefined });
  }

  function handlePenChange(val: string): void {
    onChange({ penId: val === 'all' ? undefined : val });
  }

  function handleStatusChange(val: string): void {
    onChange({ status: val === 'all' ? undefined : val });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select onValueChange={handleFarmChange} value={filters.farmId ?? 'all'}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả trại" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trại</SelectItem>
          {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={handleZoneChange} value={filters.zoneId ?? 'all'} disabled={!filters.farmId}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả khu" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả khu</SelectItem>
          {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={handlePenChange} value={filters.penId ?? 'all'} disabled={!filters.zoneId}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả ô" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả ô</SelectItem>
          {pens.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={handleStatusChange} value={filters.status ?? 'all'}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {HEALTH_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
