'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const schema = yup.object({ email: yup.string().email('Email không hợp lệ').required('Bắt buộc'), password: yup.string().min(8, 'Tối thiểu 8 ký tự').required('Bắt buộc') });
type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<LoginForm>({ resolver: yupResolver(schema) });

  async function onSubmit(values: LoginForm): Promise<void> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json() as { message?: string };
        toast({ title: 'Đăng nhập thất bại', description: err.message ?? 'Sai email hoặc mật khẩu', variant: 'destructive' });
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      toast({ title: 'Lỗi kết nối', description: 'Không thể kết nối đến máy chủ', variant: 'destructive' });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-3xl font-extrabold text-primary">HD-FARM</div>
          <CardTitle className="text-lg">Đăng nhập quản trị</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
