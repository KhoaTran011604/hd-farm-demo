'use client';

import { useTranslations } from 'next-intl';
import { Download, Search, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AnimalFilters } from '@/lib/animal-types';
import { useFarmsQuery } from '@/queries/farms/queries';
import { useZonesQuery } from '@/queries/zones/queries';
import { usePensQuery } from '@/queries/pens/queries';
import type { HealthStatus, AnimalSpecies } from '@hd-farm/shared';

const HEALTH_STATUS_KEYS: HealthStatus[] = [
  'healthy',
  'monitoring',
  'sick',
  'quarantine',
  'recovered',
  'dead',
  'sold',
];

const SPECIES_KEYS: AnimalSpecies[] = ['heo', 'gà', 'bò'];

interface AnimalFiltersProps {
  filters: AnimalFilters;
  onChange: (updated: Partial<AnimalFilters>) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  species?: string;
  onSpeciesChange?: (value: string | undefined) => void;
  onExport?: () => void;
  onImport?: () => void;
}

export function AnimalFilters({
  filters,
  onChange,
  search,
  onSearchChange,
  species,
  onSpeciesChange,
  onExport,
  onImport,
}: AnimalFiltersProps): React.JSX.Element {
  const tFilters = useTranslations('animals.filters');
  const tStatus = useTranslations('animals.status');
  const tSpecies = useTranslations('animals.species');
  const { data: farms = [] } = useFarmsQuery();
  const { data: zones = [] } = useZonesQuery(filters.farmId);
  const { data: pens = [] } = usePensQuery(filters.zoneId);

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-3.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          value={search ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={tFilters('searchPlaceholder')}
          className="h-[38px] w-full rounded-lg border border-[#E5E7EB] bg-background pl-[34px] pr-3 text-[13.5px] text-[#1A2E0A] placeholder:text-[#9CA3AF] focus:border-primary-light focus:outline-none focus:ring-[3px] focus:ring-primary-light/10"
        />
      </div>

      <Select
        onValueChange={(v) => onChange({ farmId: v === 'all' ? undefined : v, zoneId: undefined, penId: undefined })}
        value={filters.farmId ?? 'all'}
      >
        <SelectTrigger className="h-[38px] w-auto min-w-[140px] border-[#E5E7EB] bg-white">
          <SelectValue placeholder={tFilters('allFarms')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allFarms')}</SelectItem>
          {farms.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(v) => onChange({ zoneId: v === 'all' ? undefined : v, penId: undefined })}
        value={filters.zoneId ?? 'all'}
        disabled={!filters.farmId}
      >
        <SelectTrigger className="h-[38px] w-auto min-w-[140px] border-[#E5E7EB] bg-white">
          <SelectValue placeholder={tFilters('allZones')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allZones')}</SelectItem>
          {zones.map((z) => (
            <SelectItem key={z.id} value={z.id}>
              {z.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(v) => onSpeciesChange?.(v === 'all' ? undefined : v)}
        value={species ?? 'all'}
      >
        <SelectTrigger className="h-[38px] w-auto min-w-[130px] border-[#E5E7EB] bg-white">
          <SelectValue placeholder={tFilters('allSpecies')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allSpecies')}</SelectItem>
          {SPECIES_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {tSpecies(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(v) => onChange({ status: v === 'all' ? undefined : v })}
        value={filters.status ?? 'all'}
      >
        <SelectTrigger className="h-[38px] w-auto min-w-[160px] border-[#E5E7EB] bg-white">
          <SelectValue placeholder={tFilters('allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allStatuses')}</SelectItem>
          {HEALTH_STATUS_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {tStatus(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(v) => onChange({ penId: v === 'all' ? undefined : v })}
        value={filters.penId ?? 'all'}
        disabled={!filters.zoneId}
      >
        <SelectTrigger className="h-[38px] w-auto min-w-[130px] border-[#E5E7EB] bg-white">
          <SelectValue placeholder={tFilters('allPens')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tFilters('allPens')}</SelectItem>
          {pens.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mx-1 h-6 w-px bg-[#E5E7EB]" />

      {onImport ? (
        <button
          type="button"
          onClick={onImport}
          className="flex h-[38px] items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] text-[#4B5563] hover:bg-background"
        >
          <Upload className="h-[15px] w-[15px]" />
          {tFilters('importExcel')}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onExport}
        className="flex h-[38px] items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] text-[#4B5563] hover:bg-background"
      >
        <Download className="h-[15px] w-[15px]" />
        {tFilters('exportCsv')}
      </button>
    </div>
  );
}
