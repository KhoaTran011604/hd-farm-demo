'use client';

import * as yup from 'yup';
import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GenericForm, FormTextField, FormSelect, FormActions, useFormValue } from '@/components/ui/generic-form';
import { useToast } from '@/hooks/use-toast';
import { useFarmsQuery } from '@/queries/farms/queries';
import { useZonesQuery } from '@/queries/zones/queries';
import { usePensQuery } from '@/queries/pens/queries';
import { useCreateAnimal } from '@/queries/animals/mutations';

const schema = yup.object({
  name: yup.string().required('Bắt buộc'),
  species: yup.string().oneOf(['heo', 'gà', 'bò'] as const).required('Bắt buộc'),
  farmId: yup.string().required('Chọn trại'),
  zoneId: yup.string().required('Chọn khu vực'),
  penId: yup.string().required('Chọn ô chuồng'),
  qrCode: yup.string().optional(),
});

type AnimalFormValues = yup.InferType<typeof schema>;

const SPECIES_OPTIONS = [
  { value: 'heo', label: 'Heo' },
  { value: 'gà', label: 'Gà' },
  { value: 'bò', label: 'Bò' },
];

const DEFAULT_VALUES = {
  name: '',
  species: '' as 'heo' | 'gà' | 'bò',
  farmId: '',
  zoneId: '',
  penId: '',
  qrCode: '',
};

// Rendered inside FormProvider — watches cascading select dependencies
function LocationFields(): React.JSX.Element {
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
        label="Trại"
        required
        options={farms.map((f) => ({ value: f.id, label: f.name }))}
        onValueChange={() => { setValue('zoneId', ''); setValue('penId', ''); }}
      />
      <FormSelect
        name="zoneId"
        label="Khu vực"
        required
        options={zones.map((z) => ({ value: z.id, label: z.name }))}
        disabled={!farmId}
        onValueChange={() => setValue('penId', '')}
      />
      <FormSelect
        name="penId"
        label="Ô chuồng"
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

  const createAnimal = useCreateAnimal({
    onSuccess: () => {
      toast({ title: 'Thành công', description: 'Đã thêm vật nuôi mới' });
      router.push('/animals');
      router.refresh();
    },
    onError: (message) => {
      toast({ title: 'Lỗi', description: message, variant: 'destructive' });
    },
  });

  return (
    <GenericForm
      schema={schema}
      defaultValues={DEFAULT_VALUES}
      onSubmit={async (values) => {
        await createAnimal.mutateAsync({
          name: values.name,
          species: values.species,
          penId: values.penId,
          qrCode: values.qrCode || undefined,
        });
      }}
      showSubmitButton={false}
    >
      <FormTextField name="name" label="Tên vật nuôi" required placeholder="Ví dụ: Heo A01" />
      <FormSelect name="species" label="Loài" required options={SPECIES_OPTIONS} />
      <LocationFields />
      <FormTextField name="qrCode" label="Mã QR (tuỳ chọn)" placeholder="Tự động nếu để trống" />
      <FormActions>
        <Button type="button" variant="outline" onClick={() => router.back()}>Huỷ</Button>
        <Button type="submit">Thêm vật nuôi</Button>
      </FormActions>
    </GenericForm>
  );
}
