'use client';

import * as React from 'react';
import * as yup from 'yup';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GenericForm,
  FormTextField,
  FormSelect,
  useFormValue,
} from '@/components/ui/generic-form';
import { useFarmsQuery } from '@/queries/farms/queries';
import { useZonesQuery } from '@/queries/zones/queries';
import { usePensQuery } from '@/queries/pens/queries';
import { useUpdateAnimal } from '@/queries/animals/mutations';
import type { AnimalRow } from '@/lib/animal-types';

interface AnimalEditDialogProps {
  animal: AnimalRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormValues {
  name: string;
  farmId: string;
  zoneId: string;
  penId: string;
}

function LocationFields(): React.JSX.Element {
  const tForm = useTranslations('animals.form');
  const farmId = useFormValue<FormValues>('farmId');
  const zoneId = useFormValue<FormValues>('zoneId');
  const { setValue } = useFormContext<FormValues>();

  const { data: farms = [] } = useFarmsQuery();
  const { data: zones = [] } = useZonesQuery(farmId || undefined);
  const { data: pens = [] } = usePensQuery(zoneId || undefined);

  return (
    <>
      <FormSelect
        name="farmId"
        label={tForm('farmLabel')}
        required
        options={farms.map((f) => ({ value: f.id, label: f.name }))}
        onValueChange={() => {
          setValue('zoneId', '');
          setValue('penId', '');
        }}
      />
      <FormSelect
        name="zoneId"
        label={tForm('zoneLabel')}
        required
        options={zones.map((z) => ({ value: z.id, label: z.name }))}
        disabled={!farmId}
        onValueChange={() => setValue('penId', '')}
      />
      <FormSelect
        name="penId"
        label={tForm('penLabel')}
        required
        options={pens.map((p) => ({ value: p.id, label: p.name }))}
        disabled={!zoneId}
      />
    </>
  );
}

export function AnimalEditDialog({
  animal,
  open,
  onOpenChange,
}: AnimalEditDialogProps): React.JSX.Element {
  const tCommon = useTranslations('common');
  const tForm = useTranslations('animals.form');
  const tEdit = useTranslations('animals.edit');

  const schema = React.useMemo(
    () =>
      yup.object({
        name: yup.string().required(tCommon('required')).min(2).max(100),
        farmId: yup.string().required(tForm('chooseFarm')),
        zoneId: yup.string().required(tForm('chooseZone')),
        penId: yup.string().uuid().required(tForm('choosePen')),
      }) as yup.ObjectSchema<FormValues>,
    [tCommon, tForm],
  );

  const defaultValues = React.useMemo<FormValues>(
    () => ({
      name: animal.name,
      farmId: animal.farmId,
      zoneId: animal.pen?.zoneId ?? animal.zone?.id ?? '',
      penId: animal.penId ?? '',
    }),
    [animal],
  );

  const mutation = useUpdateAnimal(animal.id, {
    onSuccess: () => {
      onOpenChange(false);
      toast.success(tEdit('updated'));
    },
    onError: (msg) => toast.error(msg),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tEdit('title')}</DialogTitle>
        </DialogHeader>

        <GenericForm<FormValues>
          schema={schema}
          defaultValues={defaultValues}
          onSubmit={async (values) => {
            await mutation.mutateAsync({
              name: values.name,
              penId: values.penId,
            });
          }}
          submitLabel={tEdit('submit')}
        >
          <FormTextField
            name="name"
            label={tForm('nameLabel')}
            required
            placeholder={tForm('namePlaceholder')}
          />
          <LocationFields />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
