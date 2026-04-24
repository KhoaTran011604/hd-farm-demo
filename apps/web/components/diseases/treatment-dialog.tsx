'use client';

import * as React from 'react';
import * as yup from 'yup';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GenericForm, FormTextField, FormTextArea } from '@/components/ui/generic-form';
import { useCreateTreatment } from '@/queries/diseases/mutations';

interface TreatmentDialogProps {
  animalId: string;
  diseaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  medicine: string;
  dosage: string;
  withdrawalDays: string;
  treatedAt: string;
  endedAt: string;
  notes: string;
}

const schema = yup.object({
  medicine: yup.string().required('Medicine is required'),
  dosage: yup.string(),
  withdrawalDays: yup.string(),
  treatedAt: yup.string().required('Date is required'),
  endedAt: yup.string(),
  notes: yup.string(),
}) as yup.ObjectSchema<FormValues>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TreatmentDialog({
  animalId,
  diseaseId,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: TreatmentDialogProps): React.JSX.Element {
  const tT = useTranslations('disease.treatment');

  const mutation = useCreateTreatment(animalId, diseaseId, {
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
    onError,
  });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    const wd = data.withdrawalDays ? parseInt(data.withdrawalDays, 10) : undefined;
    await mutation.mutateAsync({
      animalId,
      diseaseRecordId: diseaseId,
      medicine: data.medicine,
      dosage: data.dosage || undefined,
      withdrawalDays: Number.isFinite(wd) ? wd : undefined,
      treatedAt: data.treatedAt,
      endedAt: data.endedAt || null,
      notes: data.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tT('medicine')}</DialogTitle>
        </DialogHeader>

        <GenericForm<FormValues>
          schema={schema}
          defaultValues={{
            medicine: '',
            dosage: '',
            withdrawalDays: '',
            treatedAt: todayISO(),
            endedAt: '',
            notes: '',
          }}
          onSubmit={handleSubmit}
          resetOnSuccess
        >
          <FormTextField
            name="medicine"
            label={tT('medicine')}
            placeholder={tT('medicinePlaceholder')}
            required
          />
          <FormTextField
            name="dosage"
            label={tT('dosage')}
            placeholder={tT('dosagePlaceholder')}
          />
          <FormTextField
            name="withdrawalDays"
            label={tT('withdrawalDays')}
            type="number"
            min={0}
            description={tT('withdrawalHint')}
          />
          <FormTextField name="treatedAt" label={tT('treatedAt')} type="date" required />
          <FormTextField name="endedAt" label={tT('endedAt')} type="date" />
          <FormTextArea name="notes" label={tT('notes')} rows={2} />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
