'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Scale, Activity, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/animals/status-badge';
import { HealthRecordDialog } from '@/components/animals/health-record-dialog';
import { useAnimalHealthQuery } from '@/queries/animals/queries';
import { formatDateTime } from '@/lib/utils';
import type { HealthRecord } from '@/queries/animals/queries';
import type { HealthStatus } from '@hd-farm/shared';

interface HealthTabProps {
  animalId: string;
}

export function HealthTab({ animalId }: HealthTabProps): React.JSX.Element {
  const tHealth = useTranslations('animals.healthActions');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAnimalHealthQuery(animalId);

  const records = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {tHealth('recordHealth')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Activity className="h-8 w-8 opacity-40" />
          <p className="text-sm">{tHealth('noRecords')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <HealthRecordRow key={record.id} record={record} />
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
                {tHealth('loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}

      <HealthRecordDialog
        animalId={animalId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => toast.success(tHealth('recorded'))}
        onError={(msg) => toast.error(msg)}
      />
    </>
  );
}

function HealthRecordRow({ record }: { record: HealthRecord }): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-3 flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {record.weightKg && !record.status ? (
          <Scale className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Activity className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {record.status && (
            <StatusBadge status={record.status as HealthStatus} />
          )}
          {record.weightKg && (
            <span className="text-xs font-medium text-muted-foreground">
              {parseFloat(record.weightKg).toFixed(1)} kg
            </span>
          )}
        </div>
        {record.notes && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{record.notes}</p>
        )}
      </div>

      <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {formatDateTime(record.checkedAt)}
      </time>
    </div>
  );
}
