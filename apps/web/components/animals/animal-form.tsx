'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenericForm } from '@/components/ui/generic-form';
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

export function AnimalForm(): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<AnimalFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', species: undefined, farmId: '', zoneId: '', penId: '', qrCode: '' },
  });

  const farmId = form.watch('farmId');
  const zoneId = form.watch('zoneId');

  const { data: farms = [] } = useFarmsQuery();
  const { data: zones = [] } = useZonesQuery(farmId || undefined);
  const { data: pens = [] } = usePensQuery(zoneId || undefined);

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

  async function onSubmit(values: AnimalFormValues): Promise<void> {
    createAnimal.mutate({
      name: values.name,
      species: values.species as 'heo' | 'gà' | 'bò',
      penId: values.penId,
      qrCode: values.qrCode || undefined,
    });
  }

  return (
    <GenericForm form={form} onSubmit={onSubmit} onCancel={() => router.back()} submitLabel="Thêm vật nuôi">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Tên vật nuôi</FormLabel><FormControl><Input placeholder="Ví dụ: Heo A01" {...field} /></FormControl><FormMessage /></FormItem>
      )} />

      <FormField control={form.control} name="species" render={({ field }) => (
        <FormItem><FormLabel>Loài</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Chọn loài" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="heo">Heo</SelectItem>
              <SelectItem value="gà">Gà</SelectItem>
              <SelectItem value="bò">Bò</SelectItem>
            </SelectContent>
          </Select><FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="farmId" render={({ field }) => (
        <FormItem><FormLabel>Trại</FormLabel>
          <Select onValueChange={(v) => { field.onChange(v); form.resetField('zoneId'); form.resetField('penId'); }} value={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Chọn trại" /></SelectTrigger></FormControl>
            <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select><FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="zoneId" render={({ field }) => (
        <FormItem><FormLabel>Khu vực</FormLabel>
          <Select onValueChange={(v) => { field.onChange(v); form.resetField('penId'); }} value={field.value} disabled={!farmId}>
            <FormControl><SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger></FormControl>
            <SelectContent>{zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
          </Select><FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="penId" render={({ field }) => (
        <FormItem><FormLabel>Ô chuồng</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={!zoneId}>
            <FormControl><SelectTrigger><SelectValue placeholder="Chọn ô chuồng" /></SelectTrigger></FormControl>
            <SelectContent>{pens.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select><FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="qrCode" render={({ field }) => (
        <FormItem><FormLabel>Mã QR (tuỳ chọn)</FormLabel><FormControl><Input placeholder="Tự động nếu để trống" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
    </GenericForm>
  );
}
