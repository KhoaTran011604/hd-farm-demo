'use client';

import * as React from 'react';
import * as yup from 'yup';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GenericForm, FormSelect, FormTextField, FormTextArea } from '@/components/ui/generic-form';
import { useUpdateAnimalStatus } from '@/queries/animals/mutations';
import { TRANSITIONS, TERMINAL_STATUSES } from '@hd-farm/shared';
import type { HealthStatus } from '@hd-farm/shared';

interface StatusChangeDialogProps {
  animalId: string;
  currentStatus: HealthStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  status: string;
  weightKg: string;
  reason: string;
}

const schema = yup.object({
  status: yup.string().required('Status is required'),
  weightKg: yup
    .string()
    .test('valid-weight', 'Weight must be between 0 and 2000 kg', (val) => {
      if (!val) return true;
      const n = parseFloat(val);
      return !isNaN(n) && n > 0 && n <= 2000;
    }),
  reason: yup.string(),
}) as yup.ObjectSchema<FormValues>;

export function StatusChangeDialog({
  animalId,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: StatusChangeDialogProps): React.JSX.Element {
  const t = useTranslations('animals');
  const tHealth = useTranslations('animals.healthActions');

  const allowedStatuses = (TRANSITIONS[currentStatus] ?? []) as HealthStatus[];
  const statusOptions = allowedStatuses.map((s) => ({
    value: s,
    label: t(`status.${s}`),
  }));

  const mutation = useUpdateAnimalStatus(animalId, {
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
    onError,
  });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    await mutation.mutateAsync({
      status: data.status,
      weightKg: data.weightKg ? parseFloat(data.weightKg) : undefined,
      reason: data.reason || undefined,
    });
  };

  const [watchedStatus, setWatchedStatus] = React.useState('');
  const isTerminal = TERMINAL_STATUSES.includes(watchedStatus as HealthStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tHealth('changeStatusTitle')}</DialogTitle>
        </DialogHeader>

        {statusOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {tHealth('noTransitionsAvailable')}
          </p>
        ) : (
          <GenericForm<FormValues>
            schema={schema}
            defaultValues={{ status: '', weightKg: '', reason: '' }}
            onSubmit={handleSubmit}
            submitLabel={tHealth('confirmChange')}
          >
            <FormSelect
              name="status"
              label={tHealth('newStatus')}
              options={statusOptions}
              required
              onValueChange={setWatchedStatus}
            />

            <FormTextField
              name="weightKg"
              label={tHealth('weightKg')}
              type="number"
              placeholder={tHealth('weightPlaceholder')}
              min={0.1}
            />

            <FormTextArea
              name="reason"
              label={tHealth('note')}
              placeholder={tHealth('notePlaceholder')}
              rows={2}
            />

            {isTerminal && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{tHealth('terminalWarning')}</span>
              </div>
            )}
          </GenericForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
