'use client';

import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GenericFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  onSubmit: SubmitHandler<TValues>;
  children: React.ReactNode;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

export function GenericForm<TValues extends FieldValues>({
  form,
  onSubmit,
  children,
  onCancel,
  submitLabel = 'Lưu',
  className,
}: GenericFormProps<TValues>): React.JSX.Element {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-5 max-w-lg', className)}>
        {children}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Đang lưu...' : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Huỷ
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
