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
import { useCreateVaccination } from '@/queries/vaccinations/mutations';
import { queryKeys } from '@/queries/keys';
import type { VaccineType } from '@hd-farm/shared';

interface VaccinationDialogProps {
  animalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  vaccineTypeId: string;
  batchNumber: string;
  vaccinatedAt: string;
  nextDueAt: string;
  notes: string;
}

const schema = yup.object({
  vaccineTypeId: yup.string().uuid().required('Vaccine type is required'),
  batchNumber: yup.string(),
  vaccinatedAt: yup.string().required('Date is required'),
  nextDueAt: yup.string(),
  notes: yup.string(),
}) as yup.ObjectSchema<FormValues>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function VaccinationDialog({
  animalId,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: VaccinationDialogProps): React.JSX.Element {
  const tV = useTranslations('vaccination');

  const { data: vaccineTypes = [] } = useQuery<VaccineType[]>({
    queryKey: queryKeys.config.vaccineTypes,
    queryFn: async () => {
      const res = await fetch('/api/proxy/config/vaccine-types');
      if (!res.ok) throw new Error('Failed to fetch vaccine types');
      return res.json() as Promise<VaccineType[]>;
    },
  });

  // Track selected vaccine for description hint only
  const [selectedInterval, setSelectedInterval] = React.useState<number | null>(null);

  const mutation = useCreateVaccination(animalId, {
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
    onError,
  });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    const vt = vaccineTypes.find((v) => v.id === data.vaccineTypeId);
    const computedNextDue =
      !data.nextDueAt && vt?.intervalDays
        ? addDays(data.vaccinatedAt, vt.intervalDays)
        : undefined;

    await mutation.mutateAsync({
      animalId,
      vaccineTypeId: data.vaccineTypeId,
      batchNumber: data.batchNumber || undefined,
      vaccinatedAt: data.vaccinatedAt,
      nextDueAt: data.nextDueAt || computedNextDue,
      notes: data.notes || undefined,
    });
  };

  const vaccineOptions = vaccineTypes.map((vt) => ({
    value: vt.id,
    label: vt.name,
  }));

  const intervalHint = selectedInterval
    ? `${tV('nextDueAutoFill')} (+${selectedInterval} ${tV('today')})`
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tV('recordVaccination')}</DialogTitle>
        </DialogHeader>

        <GenericForm<FormValues>
          schema={schema}
          defaultValues={{
            vaccineTypeId: '',
            batchNumber: '',
            vaccinatedAt: todayISO(),
            nextDueAt: '',
            notes: '',
          }}
          onSubmit={handleSubmit}
          resetOnSuccess
        >
          <FormSelect
            name="vaccineTypeId"
            label={tV('vaccineType')}
            options={vaccineOptions}
            placeholder={tV('chooseVaccineType')}
            required
            onValueChange={(val) => {
              const vt = vaccineTypes.find((v) => v.id === val);
              setSelectedInterval(vt?.intervalDays ?? null);
            }}
          />

          <FormTextField
            name="vaccinatedAt"
            label={tV('vaccinatedAt')}
            type="date"
            required
          />

          <FormTextField
            name="nextDueAt"
            label={tV('nextDueAt')}
            type="date"
            description={intervalHint}
          />

          <FormTextField
            name="batchNumber"
            label={tV('batchNumber')}
            placeholder={tV('batchPlaceholder')}
          />

          <FormTextArea
            name="notes"
            label={tV('notes')}
            placeholder={tV('notesPlaceholder')}
            rows={2}
          />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
