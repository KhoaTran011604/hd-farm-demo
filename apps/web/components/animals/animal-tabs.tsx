'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { HealthTab } from '@/components/animals/health-tab';
import { VaccinationTab } from '@/components/animals/vaccination-tab';
import { AnimalOverviewPanel } from '@/components/animals/animal-overview-panel';
import { StatusChangeDialog } from '@/components/animals/status-change-dialog';
import type { AnimalRow } from '@/lib/animal-types';
import { cn } from '@/lib/utils';

type TabKey =
  | 'overview'
  | 'health'
  | 'vaccination'
  | 'disease'
  | 'feeding'
  | 'reproduction';

const PLACEHOLDER_TABS: Record<string, number> = {
  disease: 8,
  feeding: 10,
  reproduction: 11,
};

const TAB_KEYS: TabKey[] = [
  'overview',
  'health',
  'vaccination',
  'disease',
  'feeding',
  'reproduction',
];

interface AnimalTabsProps {
  animal: AnimalRow;
}

export function AnimalTabs({ animal }: AnimalTabsProps): React.JSX.Element {
  const tTabs = useTranslations('animals.tabs');
  const tHealth = useTranslations('animals.healthActions');
  const router = useRouter();

  const [active, setActive] = React.useState<TabKey>('overview');
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex overflow-x-auto border-b border-[#F3F4F6] px-5">
          {TAB_KEYS.map((key) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-4 py-3.5 text-[13.5px] font-semibold transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#4B5563]',
                )}
              >
                {tTabs(key)}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {active === 'overview' ? (
            <AnimalOverviewPanel
              animal={animal}
              onChangeStatus={() => setStatusDialogOpen(true)}
            />
          ) : null}
          {active === 'health' ? <HealthTab animalId={animal.id} /> : null}
          {active === 'vaccination' ? <VaccinationTab animalId={animal.id} /> : null}
          {PLACEHOLDER_TABS[active] ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <span className="text-4xl">🚧</span>
              <p className="text-sm font-medium">
                {tTabs('comingInPhase', {
                  label: tTabs(active),
                  phase: PLACEHOLDER_TABS[active],
                })}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <StatusChangeDialog
        animalId={animal.id}
        currentStatus={animal.status}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onSuccess={() => {
          toast.success(tHealth('statusUpdated'));
          router.refresh();
        }}
        onError={(msg) => toast.error(msg)}
      />
    </>
  );
}
