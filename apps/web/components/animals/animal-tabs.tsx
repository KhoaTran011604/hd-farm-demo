'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/animals/status-badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { AnimalRow } from '@/lib/animal-types';

const PLACEHOLDER_TABS = [
  { value: 'health', phase: 6 },
  { value: 'vaccination', phase: 7 },
  { value: 'disease', phase: 8 },
  { value: 'feeding', phase: 10 },
  { value: 'reproduction', phase: 11 },
] as const;

interface AnimalTabsProps {
  animal: AnimalRow;
}

export function AnimalTabs({ animal }: AnimalTabsProps): React.JSX.Element {
  const tTabs = useTranslations('animals.tabs');
  const tFields = useTranslations('animals.fields');
  const tSpecies = useTranslations('animals.species');

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4 h-auto flex-wrap gap-1">
        <TabsTrigger value="overview">{tTabs('overview')}</TabsTrigger>
        {PLACEHOLDER_TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {tTabs(t.value)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2">
          <OverviewField label={tFields('name')} value={animal.name} />
          <OverviewField label={tFields('species')} value={tSpecies(animal.species)} />
          <OverviewField label={tFields('status')} value={<StatusBadge status={animal.status} />} />
          <OverviewField label={tFields('qrCode')} value={<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{animal.qrCode}</code>} />
          <OverviewField label={tFields('pen')} value={animal.pen?.name ?? '—'} />
          <OverviewField label={tFields('zone')} value={animal.zone?.name ?? '—'} />
          <OverviewField label={tFields('createdAtLong')} value={formatDate(animal.createdAt)} />
          <OverviewField label={tFields('updatedAt')} value={formatDateTime(animal.updatedAt)} />
        </div>
      </TabsContent>

      {PLACEHOLDER_TABS.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <span className="text-4xl">🚧</span>
            <p className="text-sm font-medium">
              {tTabs('comingInPhase', { label: tTabs(t.value), phase: t.phase })}
            </p>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function OverviewField({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
