'use client';

import * as React from 'react';
import * as yup from 'yup';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GenericForm, FormSelect, FormTextField, FormTextArea } from '@/components/ui/generic-form';
import { useCreateDisease } from '@/queries/diseases/mutations';
import { queryKeys } from '@/queries/keys';
import type { DiseaseType } from '@hd-farm/shared';
import { DISEASE_SEVERITIES } from '@hd-farm/shared';

interface DiseaseDialogProps {
  animalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  diseaseTypeId: string;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms: string;
  notes: string;
  diagnosedAt: string;
}

const schema = yup.object({
  diseaseTypeId: yup.string(),
  severity: yup
    .string()
    .oneOf([...DISEASE_SEVERITIES])
    .required('Severity is required'),
  symptoms: yup.string(),
  notes: yup.string(),
  diagnosedAt: yup.string().required('Date is required'),
}) as yup.ObjectSchema<FormValues>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function DiseaseDialog({
  animalId,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: DiseaseDialogProps): React.JSX.Element {
  const tD = useTranslations('disease');

  const { data: diseaseTypes = [] } = useQuery<DiseaseType[]>({
    queryKey: queryKeys.config.diseaseTypes,
    queryFn: async () => {
      const res = await fetch('/api/proxy/config/disease-types');
      if (!res.ok) throw new Error('Failed to fetch disease types');
      return res.json() as Promise<DiseaseType[]>;
    },
  });

  const mutation = useCreateDisease(animalId, {
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
    onError,
  });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    await mutation.mutateAsync({
      animalId,
      diseaseTypeId: data.diseaseTypeId || null,
      severity: data.severity,
      symptoms: data.symptoms || undefined,
      notes: data.notes || undefined,
      diagnosedAt: data.diagnosedAt,
    });
  };

  const diseaseOptions = diseaseTypes.map((dt) => ({ value: dt.id, label: dt.name }));

  const severityOptions = DISEASE_SEVERITIES.map((s) => ({
    value: s,
    label: tD(`severities.${s}`),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tD('recordDisease')}</DialogTitle>
        </DialogHeader>

        <GenericForm<FormValues>
          schema={schema}
          defaultValues={{
            diseaseTypeId: '',
            severity: 'mild',
            symptoms: '',
            notes: '',
            diagnosedAt: todayISO(),
          }}
          onSubmit={handleSubmit}
          resetOnSuccess
        >
          <FormSelect
            name="diseaseTypeId"
            label={tD('diseaseType')}
            options={diseaseOptions}
            placeholder={tD('chooseDiseaseType')}
          />

          <FormSelect
            name="severity"
            label={tD('severity')}
            options={severityOptions}
            required
          />

          <FormTextField name="diagnosedAt" label={tD('diagnosedAt')} type="date" required />

          <FormTextArea
            name="symptoms"
            label={tD('symptoms')}
            placeholder={tD('symptomsPlaceholder')}
            rows={2}
          />

          <FormTextArea name="notes" label={tD('notes')} rows={2} />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
