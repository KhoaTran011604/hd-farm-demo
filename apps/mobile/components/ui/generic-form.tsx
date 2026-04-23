import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import {
  useForm,
  useFormContext,
  FormProvider,
  Controller,
  type FieldValues,
  type DefaultValues,
  type Path,
  type Resolver,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';

// =============================================================================
// GENERIC FORM (Main Container)
// =============================================================================

export interface GenericFormProps<TData extends FieldValues, TResponse = unknown> {
  schema: yup.ObjectSchema<TData>;
  defaultValues: DefaultValues<TData>;
  onSubmit: (data: TData) => Promise<TResponse>;
  onSuccess?: (response: TResponse) => void;
  onError?: (error: Error) => void;
  children: React.ReactNode;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  style?: StyleProp<ViewStyle>;
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
  submitLabel = 'Lưu',
  resetOnSuccess = false,
  style,
  showSubmitButton = true,
  disabled = false,
}: GenericFormProps<TData, TResponse>): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<TData>({
    resolver: yupResolver(schema) as unknown as Resolver<TData>,
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  const handleFormSubmit = async (data: TData): Promise<void> => {
    if (isSubmitting || disabled) return;
    setIsSubmitting(true);
    try {
      const response = await onSubmit(data);
      if (resetOnSuccess) methods.reset(defaultValues);
      onSuccess?.(response);
    } catch (error) {
      if (error instanceof Error) onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <View style={[styles.container, style]}>
        {children}
        {showSubmitButton && (
          <Button
            label={isSubmitting ? 'Đang xử lý...' : submitLabel}
            onPress={methods.handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting || disabled}
          />
        )}
      </View>
    </FormProvider>
  );
}

// =============================================================================
// FORM FIELD WRAPPER (Internal)
// =============================================================================

function FieldWrapper({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// =============================================================================
// FORM TEXT FIELD
// =============================================================================

export interface FormTextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
}

export function FormTextField({
  name,
  label,
  placeholder,
  required,
  secureTextEntry,
  disabled,
  keyboardType,
  multiline,
}: FormTextFieldProps): React.JSX.Element {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <FieldWrapper label={label} error={error} required={required}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TextInput
            style={[styles.input, error ? styles.inputError : null, multiline ? styles.textarea : null]}
            value={(field.value as string) ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            secureTextEntry={secureTextEntry}
            editable={!disabled}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        )}
      />
    </FieldWrapper>
  );
}

// =============================================================================
// FORM ACTIONS (Custom submit/cancel buttons area)
// =============================================================================

export interface FormActionsProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FormActions({ children, style }: FormActionsProps): React.JSX.Element {
  return <View style={[styles.actions, style]}>{children}</View>;
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

const styles = StyleSheet.create({
  container: { gap: 16 },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  required: { color: '#d1242f' },
  error: { fontSize: 12, color: '#d1242f' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { height: 100, paddingTop: 11 },
  inputError: { borderColor: '#d1242f' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
