'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Syringe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { VaccinationDialog } from '@/components/vaccinations/vaccination-dialog';
import { useAnimalVaccinationsQuery } from '@/queries/vaccinations/queries';
import { formatDate } from '@/lib/utils';
import type { VaccinationRecord } from '@/queries/vaccinations/queries';

interface VaccinationTabProps {
  animalId: string;
}

export function VaccinationTab({ animalId }: VaccinationTabProps): React.JSX.Element {
  const tV = useTranslations('vaccination');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAnimalVaccinationsQuery(animalId);

  const records = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Syringe className="mr-2 h-4 w-4" />
          {tV('recordVaccination')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Syringe className="h-8 w-8 opacity-40" />
          <p className="text-sm">{tV('noRecords')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <VaccinationRow key={r.id} record={r} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {tV('loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}

      <VaccinationDialog
        animalId={animalId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => toast.success(tV('created'))}
        onError={(msg) => toast.error(msg)}
      />
    </>
  );
}

function VaccinationRow({ record }: { record: VaccinationRecord }): React.JSX.Element {
  const tV = useTranslations('vaccination');

  return (
    <div className="rounded-lg border bg-card p-3 flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Syringe className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{record.vaccineName ?? '—'}</p>
        {record.batchNumber && (
          <p className="text-xs text-muted-foreground">#{record.batchNumber}</p>
        )}
        {record.nextDueAt && (
          <p className="text-xs text-muted-foreground">
            {tV('nextDueAt')}: {formatDate(record.nextDueAt)}
          </p>
        )}
        {record.notes && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{record.notes}</p>
        )}
      </div>

      <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {formatDate(record.vaccinatedAt)}
      </time>
    </div>
  );
}
