'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Loader2, Pill, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DiseaseDialog } from '@/components/diseases/disease-dialog';
import { TreatmentDialog } from '@/components/diseases/treatment-dialog';
import {
  useAnimalDiseasesQuery,
  useDiseaseTreatmentsQuery,
  type DiseaseRecord,
  type TreatmentRecord,
} from '@/queries/diseases/queries';
import { useUpdateDisease } from '@/queries/diseases/mutations';
import { formatDate } from '@/lib/utils';

interface DiseaseTabProps {
  animalId: string;
}

export function DiseaseTab({ animalId }: DiseaseTabProps): React.JSX.Element {
  const tD = useTranslations('disease');
  const [diseaseDialogOpen, setDiseaseDialogOpen] = React.useState(false);
  const [treatmentFor, setTreatmentFor] = React.useState<string | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAnimalDiseasesQuery(animalId);

  const records = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setDiseaseDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {tD('recordDisease')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Activity className="h-8 w-8 opacity-40" />
          <p className="text-sm">{tD('noRecords')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((d) => (
            <DiseaseCard
              key={d.id}
              disease={d}
              animalId={animalId}
              onAddTreatment={() => setTreatmentFor(d.id)}
            />
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
                {tD('resolved')}
              </Button>
            </div>
          )}
        </div>
      )}

      <DiseaseDialog
        animalId={animalId}
        open={diseaseDialogOpen}
        onOpenChange={setDiseaseDialogOpen}
        onSuccess={() => toast.success(tD('created'))}
        onError={(msg) => toast.error(msg)}
      />

      {treatmentFor ? (
        <TreatmentDialog
          animalId={animalId}
          diseaseId={treatmentFor}
          open={!!treatmentFor}
          onOpenChange={(o) => !o && setTreatmentFor(null)}
          onSuccess={() => toast.success(tD('treatment.created'))}
          onError={(msg) => toast.error(msg)}
        />
      ) : null}
    </>
  );
}

const SEVERITY_STYLES: Record<DiseaseRecord['severity'], { bg: string; text: string }> = {
  mild: { bg: '#FEF3C7', text: '#D97706' },
  moderate: { bg: '#FFEDD5', text: '#EA580C' },
  severe: { bg: '#FEE2E2', text: '#DC2626' },
};

function DiseaseCard({
  disease,
  animalId,
  onAddTreatment,
}: {
  disease: DiseaseRecord;
  animalId: string;
  onAddTreatment: () => void;
}): React.JSX.Element {
  const tD = useTranslations('disease');
  const tT = useTranslations('disease.treatment');
  const sevStyle = SEVERITY_STYLES[disease.severity];

  const { data: treatments } = useDiseaseTreatmentsQuery(disease.id);
  const resolveMut = useUpdateDisease(animalId, {
    onSuccess: () => toast.success(tD('updated')),
    onError: (msg) => toast.error(msg),
  });

  const handleResolve = () => {
    resolveMut.mutate({
      id: disease.id,
      input: { resolvedAt: new Date().toISOString().slice(0, 10) },
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: sevStyle.bg }}
        >
          <Activity className="h-4 w-4" style={{ color: sevStyle.text }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <p className="text-sm font-semibold text-[#1A2E0A]">
              {disease.diseaseName ?? tD('title')}
            </p>
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: sevStyle.bg, color: sevStyle.text }}
            >
              {tD(`severities.${disease.severity}`)}
            </span>
            {disease.resolvedAt ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                <CheckCircle2 className="h-3 w-3" />
                {tD('resolved')}
              </span>
            ) : (
              <span className="rounded bg-[#DBEAFE] px-1.5 py-0.5 text-[11px] font-semibold text-[#2563EB]">
                {tD('active')}
              </span>
            )}
          </div>

          {disease.symptoms && (
            <p className="mt-1 text-xs text-muted-foreground">{disease.symptoms}</p>
          )}

          <p className="mt-1 text-[11px] text-muted-foreground">
            {tD('diagnosedAt')}: {formatDate(disease.diagnosedAt)}
            {disease.resolvedAt
              ? ` • ${tD('resolvedAt')}: ${formatDate(disease.resolvedAt)}`
              : ''}
          </p>
        </div>

        {!disease.resolvedAt && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onAddTreatment}>
              <Pill className="mr-1 h-3 w-3" />
              {tD('addTreatment')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={resolveMut.isPending}
            >
              {tD('resolve')}
            </Button>
          </div>
        )}
      </div>

      {treatments && treatments.items.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-[#F3F4F6] pt-3 pl-11">
          {treatments.items.map((t) => (
            <TreatmentRow key={t.id} treatment={t} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-[#F3F4F6] pt-3 pl-11 text-[11px] text-muted-foreground">
          {tT('noTreatments')}
        </p>
      )}
    </div>
  );
}

function TreatmentRow({ treatment }: { treatment: TreatmentRecord }): React.JSX.Element {
  const tT = useTranslations('disease.treatment');
  return (
    <li className="flex items-start justify-between gap-3 text-xs">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1A2E0A]">
          <Pill className="mr-1 inline-block h-3 w-3 text-muted-foreground" />
          {treatment.medicine}
          {treatment.dosage ? ` — ${treatment.dosage}` : ''}
        </p>
        {treatment.withdrawalDays ? (
          <p className="text-[11px] text-muted-foreground">
            {tT('withdrawalDays')}: {treatment.withdrawalDays}
          </p>
        ) : null}
        {treatment.notes && (
          <p className="text-[11px] text-muted-foreground truncate">{treatment.notes}</p>
        )}
      </div>
      <time className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {new Date(treatment.treatedAt).toLocaleDateString()}
      </time>
    </li>
  );
}
