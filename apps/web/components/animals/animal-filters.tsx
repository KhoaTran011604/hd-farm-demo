'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AnimalFilters } from '@/lib/animal-types';
import { useFarmsQuery, useZonesQuery, usePensQuery } from '@/hooks/use-location-queries';

const HEALTH_STATUSES = [
  { value: 'healthy', label: 'Khỏe mạnh' },
  { value: 'monitoring', label: 'Theo dõi' },
  { value: 'sick', label: 'Bệnh' },
  { value: 'quarantine', label: 'Cách ly' },
  { value: 'recovered', label: 'Đã hồi phục' },
  { value: 'dead', label: 'Chết' },
  { value: 'sold', label: 'Đã bán' },
];

interface AnimalFiltersProps {
  filters: AnimalFilters;
  onChange: (updated: Partial<AnimalFilters>) => void;
}

export function AnimalFilters({ filters, onChange }: AnimalFiltersProps): React.JSX.Element {
  const { data: farms = [] } = useFarmsQuery();
  const { data: zones = [] } = useZonesQuery(filters.farmId);
  const { data: pens = [] } = usePensQuery(filters.zoneId);

  return (
    <div className="flex flex-wrap gap-3">
      <Select onValueChange={(v) => onChange({ farmId: v === 'all' ? undefined : v, zoneId: undefined, penId: undefined })} value={filters.farmId ?? 'all'}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả trại" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trại</SelectItem>
          {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onChange({ zoneId: v === 'all' ? undefined : v, penId: undefined })} value={filters.zoneId ?? 'all'} disabled={!filters.farmId}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả khu" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả khu</SelectItem>
          {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onChange({ penId: v === 'all' ? undefined : v })} value={filters.penId ?? 'all'} disabled={!filters.zoneId}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả ô" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả ô</SelectItem>
          {pens.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onChange({ status: v === 'all' ? undefined : v })} value={filters.status ?? 'all'}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {HEALTH_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
