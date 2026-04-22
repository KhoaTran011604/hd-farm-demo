'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/animals/status-badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { SPECIES_LABELS } from '@/lib/animal-types';
import type { AnimalRow } from '@/lib/animal-types';

const PLACEHOLDER_TABS = [
  { value: 'health',        label: 'Sức khoẻ',       phase: 6 },
  { value: 'vaccination',   label: 'Tiêm chủng',      phase: 7 },
  { value: 'disease',       label: 'Bệnh & Điều trị', phase: 8 },
  { value: 'feeding',       label: 'Thức ăn',         phase: 10 },
  { value: 'reproduction',  label: 'Sinh sản',        phase: 11 },
];

interface AnimalTabsProps {
  animal: AnimalRow;
}

export function AnimalTabs({ animal }: AnimalTabsProps): React.JSX.Element {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4 h-auto flex-wrap gap-1">
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        {PLACEHOLDER_TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2">
          <OverviewField label="Tên" value={animal.name} />
          <OverviewField label="Loài" value={SPECIES_LABELS[animal.species] ?? animal.species} />
          <OverviewField label="Trạng thái" value={<StatusBadge status={animal.status} />} />
          <OverviewField label="Mã QR" value={<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{animal.qrCode}</code>} />
          <OverviewField label="Ô chuồng" value={animal.pen?.name ?? '—'} />
          <OverviewField label="Khu vực" value={animal.zone?.name ?? '—'} />
          <OverviewField label="Ngày nhập trại" value={formatDate(animal.createdAt)} />
          <OverviewField label="Cập nhật lần cuối" value={formatDateTime(animal.updatedAt)} />
        </div>
      </TabsContent>

      {PLACEHOLDER_TABS.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <span className="text-4xl">🚧</span>
            <p className="text-sm font-medium">{t.label} — sẽ có ở Phase {t.phase}</p>
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
