'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Farm, Zone, Pen } from '@hd-farm/shared';

const schema = yup.object({
  name: yup.string().required('Bắt buộc'),
  species: yup.string().oneOf(['heo', 'gà', 'bò'] as const).required('Bắt buộc'),
  farmId: yup.string().required('Chọn trại'),
  zoneId: yup.string().required('Chọn khu vực'),
  penId: yup.string().required('Chọn ô chuồng'),
  qrCode: yup.string().optional(),
});
type AnimalFormValues = yup.InferType<typeof schema>;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json() as Promise<T>;
}

export function AnimalForm(): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<AnimalFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', species: undefined, farmId: '', zoneId: '', penId: '', qrCode: '' },
  });

  const farmId = form.watch('farmId');
  const zoneId = form.watch('zoneId');

  const { data: farms = [] } = useQuery<Farm[]>({ queryKey: ['farms'], queryFn: () => fetchJson('/api/proxy/farms') });
  const { data: zones = [] } = useQuery<Zone[]>({ queryKey: ['zones', farmId], queryFn: () => fetchJson(`/api/proxy/zones?farmId=${farmId}`), enabled: !!farmId });
  const { data: pens = [] } = useQuery<Pen[]>({ queryKey: ['pens', zoneId], queryFn: () => fetchJson(`/api/proxy/pens?zoneId=${zoneId}`), enabled: !!zoneId });

  async function onSubmit(values: AnimalFormValues): Promise<void> {
    try {
      const res = await fetch('/api/proxy/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name, species: values.species, penId: values.penId, qrCode: values.qrCode || undefined }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        toast({ title: 'Lỗi', description: err.message ?? 'Không thể tạo vật nuôi', variant: 'destructive' });
        return;
      }
      toast({ title: 'Thành công', description: 'Đã thêm vật nuôi mới' });
      router.push('/animals');
      router.refresh();
    } catch {
      toast({ title: 'Lỗi kết nối', description: 'Không thể kết nối đến máy chủ', variant: 'destructive' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
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

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Đang lưu...' : 'Thêm vật nuôi'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Huỷ</Button>
        </div>
      </form>
    </Form>
  );
}
