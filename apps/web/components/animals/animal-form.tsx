'use client';

import { useMemo } from 'react';
import * as yup from 'yup';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { GenericForm, FormTextField, FormSelect, FormActions, useFormValue } from '@/components/ui/generic-form';
import { useToast } from '@/hooks/use-toast';
import { useFarmsQuery } from '@/queries/farms/queries';
import { useZonesQuery } from '@/queries/zones/queries';
import { usePensQuery } from '@/queries/pens/queries';
import { useCreateAnimal } from '@/queries/animals/mutations';
import type { AnimalSpecies } from '@hd-farm/shared';

const SPECIES_KEYS: AnimalSpecies[] = ['heo', 'gà', 'bò'];

interface AnimalFormValues {
  name: string;
  species: AnimalSpecies | '';
  farmId: string;
  zoneId: string;
  penId: string;
  qrCode?: string;
}

const DEFAULT_VALUES: AnimalFormValues = {
  name: '',
  species: '',
  farmId: '',
  zoneId: '',
  penId: '',
  qrCode: '',
};

// Rendered inside FormProvider — watches cascading select dependencies
function LocationFields(): React.JSX.Element {
  const tForm = useTranslations('animals.form');
  const farmId = useFormValue<AnimalFormValues>('farmId');
  const zoneId = useFormValue<AnimalFormValues>('zoneId');
  const { setValue } = useFormContext<AnimalFormValues>();

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
        onValueChange={() => { setValue('zoneId', ''); setValue('penId', ''); }}
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

export function AnimalForm(): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const tCommon = useTranslations('common');
  const tForm = useTranslations('animals.form');
  const tSpecies = useTranslations('animals.species');

  const schema = useMemo(
    () =>
      yup.object({
        name: yup.string().required(tCommon('required')),
        species: yup.string().oneOf(SPECIES_KEYS).required(tCommon('required')),
        farmId: yup.string().required(tForm('chooseFarm')),
        zoneId: yup.string().required(tForm('chooseZone')),
        penId: yup.string().required(tForm('choosePen')),
        qrCode: yup.string().optional(),
      }),
    [tCommon, tForm],
  );

  const speciesOptions = useMemo(
    () => SPECIES_KEYS.map((key) => ({ value: key, label: tSpecies(key) })),
    [tSpecies],
  );

  const createAnimal = useCreateAnimal({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: tForm('createdToast') });
      router.push('/animals');
      router.refresh();
    },
    onError: (message) => {
      toast({ title: tCommon('error'), description: message, variant: 'destructive' });
    },
  });

  return (
    <GenericForm
      schema={schema}
      defaultValues={DEFAULT_VALUES}
      onSubmit={async (values) => {
        await createAnimal.mutateAsync({
          name: values.name,
          species: values.species as AnimalSpecies,
          penId: values.penId,
          qrCode: values.qrCode || undefined,
        });
      }}
      showSubmitButton={false}
    >
      <FormTextField name="name" label={tForm('nameLabel')} required placeholder={tForm('namePlaceholder')} />
      <FormSelect name="species" label={tForm('speciesLabel')} required options={speciesOptions} />
      <LocationFields />
      <FormTextField name="qrCode" label={tForm('qrLabel')} placeholder={tForm('qrPlaceholder')} />
      <FormActions>
        <Button type="button" variant="outline" onClick={() => router.back()}>{tCommon('cancel')}</Button>
        <Button type="submit">{tForm('submit')}</Button>
      </FormActions>
    </GenericForm>
  );
}
