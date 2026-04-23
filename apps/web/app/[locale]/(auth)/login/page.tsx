'use client';

import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GenericForm, FormTextField } from '@/components/ui/generic-form';

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Bắt buộc'),
  password: yup.string().min(8, 'Tối thiểu 8 ký tự').required('Bắt buộc'),
});
type LoginForm = yup.InferType<typeof schema>;

const DEFAULT_VALUES: LoginForm = { email: '', password: '' };

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(values: LoginForm): Promise<void> {
    let res: Response;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
    } catch {
      throw new Error('Không thể kết nối đến máy chủ');
    }
    if (!res.ok) {
      const err = await res.json() as { message?: string };
      throw new Error(err.message ?? 'Sai email hoặc mật khẩu');
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
          <GenericForm
            schema={schema}
            defaultValues={DEFAULT_VALUES}
            onSubmit={onSubmit}
            onSuccess={() => { router.push('/'); router.refresh(); }}
            onError={(error) => toast({
              title: error.message === 'Không thể kết nối đến máy chủ' ? 'Lỗi kết nối' : 'Đăng nhập thất bại',
              description: error.message,
              variant: 'destructive',
            })}
            showSubmitButton={false}
          >
            <FormTextField name="email" label="Email" type="email" placeholder="admin@example.com" required autoComplete="email" />
            <FormTextField name="password" label="Mật khẩu" type="password" placeholder="••••••••" required autoComplete="current-password" />
            <Button type="submit" className="w-full">Đăng nhập</Button>
          </GenericForm>
        </CardContent>
      </Card>
    </div>
  );
}
