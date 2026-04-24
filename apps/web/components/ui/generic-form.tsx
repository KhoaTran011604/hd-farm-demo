'use client';

import * as React from 'react';
import {
  useForm,
  useFormContext,
  FormProvider,
  FieldValues,
  DefaultValues,
  Path,
  Resolver,
  Controller,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ApiClientError } from '@/lib/api/client';

// =============================================================================
// GENERIC FORM (Main Container)
// =============================================================================

export interface GenericFormProps<TData extends FieldValues, TResponse = unknown> {
  schema: yup.ObjectSchema<TData>;
  defaultValues: DefaultValues<TData>;
  onSubmit: (data: TData) => Promise<TResponse>;
  onSuccess?: (response: TResponse) => void;
  onError?: (error: ApiClientError | Error) => void;
  children: React.ReactNode;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  className?: string;
  showSubmitButton?: boolean;
  disabled?: boolean;
}

export function GenericForm<TData extends FieldValues, TResponse = unknown>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  children,
  submitLabel,
  resetOnSuccess = false,
  className,
  showSubmitButton = true,
  disabled = false,
}: GenericFormProps<TData, TResponse>): React.ReactElement {
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const methods = useForm<TData>({
    resolver: yupResolver(schema) as unknown as Resolver<TData>,
    defaultValues,
    mode: 'onBlur',
  });

  React.useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  const handleFormSubmit = async (data: TData): Promise<void> => {
    if (isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const response = await onSubmit(data);
      if (resetOnSuccess) {
        methods.reset(defaultValues);
      }
      onSuccess?.(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.details) {
          Object.entries(error.details).forEach(([field, message]) => {
            methods.setError(field as Path<TData>, {
              type: 'server',
              message: String(message),
            });
          });
        }
        onError?.(error);
      } else if (error instanceof Error) {
        onError?.(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className={cn('flex min-h-0 flex-1 flex-col', className)}
      >
        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 px-1 py-1">
          {children}
        </div>

        {showSubmitButton && (
          <div className="flex shrink-0 justify-end gap-2 border-t bg-background px-1 pt-3">
            <Button type="submit" disabled={isSubmitting || disabled} aria-busy={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? tCommon('processing') : (submitLabel ?? tCommon('save'))}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

// =============================================================================
// FORM FIELD WRAPPER (Internal)
// =============================================================================

interface FormFieldWrapperProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function FormFieldWrapper({
  label,
  error,
  required,
  description,
  children,
  className,
}: FormFieldWrapperProps): React.ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// =============================================================================
// FORM TEXT FIELD
// =============================================================================

export interface FormTextFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url' | 'date';
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  min?: number | string;
}

export function FormTextField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  description,
  disabled,
  className,
  autoComplete,
  min,
}: FormTextFieldProps): React.ReactElement {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <Input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        min={min}
        {...register(name)}
      />
    </FormFieldWrapper>
  );
}

// =============================================================================
// FORM TEXT AREA
// =============================================================================

export interface FormTextAreaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function FormTextArea({
  name,
  label,
  placeholder,
  required,
  description,
  disabled,
  className,
  rows = 3,
}: FormTextAreaProps): React.ReactElement {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <textarea
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        aria-invalid={!!error}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive'
        )}
        {...register(name)}
      />
    </FormFieldWrapper>
  );
}

// =============================================================================
// FORM SELECT
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  required,
  description,
  disabled,
  className,
  onValueChange,
}: FormSelectProps): React.ReactElement {
  const tCommon = useTranslations('common');
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value || ''}
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            disabled={disabled}
          >
            <SelectTrigger aria-invalid={!!error}>
              <SelectValue placeholder={placeholder ?? tCommon('choose')} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FormFieldWrapper>
  );
}

// =============================================================================
// FORM CHECKBOX
// =============================================================================

export interface FormCheckboxProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox({
  name,
  label,
  description,
  disabled,
  className,
}: FormCheckboxProps): React.ReactElement {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn('flex items-start space-x-3', className)}>
          <Checkbox
            id={name}
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor={name} className="text-sm font-medium cursor-pointer">
              {label}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      )}
    />
  );
}

// =============================================================================
// FORM ACTIONS (Custom submit/cancel buttons area)
// =============================================================================

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps): React.ReactElement {
  return <div className={cn('flex justify-end gap-2 pt-4', className)}>{children}</div>;
}

// =============================================================================
// FORM ROW (for horizontal layout)
// =============================================================================

export interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps): React.ReactElement {
  return <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>{children}</div>;
}

// =============================================================================
// USE FORM VALUES HOOK (for conditional rendering)
// =============================================================================

export function useFormValues<T extends FieldValues>(): T {
  const { watch } = useFormContext<T>();
  return watch();
}

export function useFormValue<T extends FieldValues>(name: Path<T>): T[typeof name] {
  const { watch } = useFormContext<T>();
  return watch(name);
}

export default GenericForm;
