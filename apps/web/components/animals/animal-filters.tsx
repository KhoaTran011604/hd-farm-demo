'use client';

import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AnimalFilters } from '@/lib/animal-types';
import { useFarmsQuery } from '@/queries/farms/queries';
import { useZonesQuery } from '@/queries/zones/queries';
import { usePensQuery } from '@/queries/pens/queries';
import type { HealthStatus } from '@hd-farm/shared';

const HEALTH_STATUS_KEYS: HealthStatus[] = [
  'healthy',
  'monitoring',
  'sick',
  'quarantine',
  'recovered',
  'dead',
  'sold',
];

interface AnimalFiltersProps {
  filters: AnimalFilters;
  onChange: (updated: Partial<AnimalFilters>) => void;
}

export function AnimalFilters({ filters, onChange }: AnimalFiltersProps): React.JSX.Element {
  const tFilters = useTranslations('animals.filters');
  const tStatus = useTranslations('animals.status');
  const { data: farms = [] } = useFarmsQuery();
  const { data: zones = [] } = useZonesQuery(filters.farmId);
  const { data: pens = [] } = usePensQuery(filters.zoneId);

  return (
    <div className="flex flex-wrap gap-3">
      <Select onValueChange={(v) => onChange({ farmId: v === 'all' ? undefined : v, zoneId: undefined, penId: undefined })} value={filters.farmId ?? 'all'}>
        <SelectTrigger className="w-40"><SelectValue placeholder={tFilters('allFarms')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allFarms')}</SelectItem>
          {farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onChange({ zoneId: v === 'all' ? undefined : v, penId: undefined })} value={filters.zoneId ?? 'all'} disabled={!filters.farmId}>
        <SelectTrigger className="w-40"><SelectValue placeholder={tFilters('allZones')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allZones')}</SelectItem>
          {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onChange({ penId: v === 'all' ? undefined : v })} value={filters.penId ?? 'all'} disabled={!filters.zoneId}>
        <SelectTrigger className="w-40"><SelectValue placeholder={tFilters('allPens')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allPens')}</SelectItem>
          {pens.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onChange({ status: v === 'all' ? undefined : v })} value={filters.status ?? 'all'}>
        <SelectTrigger className="w-44"><SelectValue placeholder={tFilters('allStatuses')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allStatuses')}</SelectItem>
          {HEALTH_STATUS_KEYS.map((key) => <SelectItem key={key} value={key}>{tStatus(key)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
