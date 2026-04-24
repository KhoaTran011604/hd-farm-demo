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
import {
  GenericForm,
  FormTextField,
  FormTextArea,
} from '@/components/ui/generic-form';
import { useRecordAnimalWeight } from '@/queries/animals/mutations';

interface HealthRecordDialogProps {
  animalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  weightKg: string;
  note: string;
}

const schema = yup.object({
  weightKg: yup
    .string()
    .required('Weight is required')
    .test('valid-weight', 'Weight must be between 0 and 2000 kg', (val) => {
      if (!val) return false;
      const n = parseFloat(val);
      return !isNaN(n) && n > 0 && n <= 2000;
    }),
  note: yup.string(),
}) as yup.ObjectSchema<FormValues>;

export function HealthRecordDialog({
  animalId,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: HealthRecordDialogProps): React.JSX.Element {
  const tHealth = useTranslations('animals.healthActions');

  const mutation = useRecordAnimalWeight(animalId, {
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
    onError,
  });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    await mutation.mutateAsync({
      weightKg: parseFloat(data.weightKg),
      note: data.note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tHealth('recordHealthTitle')}</DialogTitle>
        </DialogHeader>

        <GenericForm<FormValues>
          schema={schema}
          defaultValues={{ weightKg: '', note: '' }}
          onSubmit={handleSubmit}
          resetOnSuccess
        >
          <FormTextField
            name="weightKg"
            label={tHealth('weightRequired')}
            type="number"
            placeholder={tHealth('weightRequiredPlaceholder')}
            required
            min={0.1}
          />
          <FormTextArea
            name="note"
            label={tHealth('note')}
            placeholder={tHealth('notePlaceholder')}
            rows={3}
          />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
