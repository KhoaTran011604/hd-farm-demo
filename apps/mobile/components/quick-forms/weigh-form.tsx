import * as yup from 'yup';
import { GenericForm, FormTextField } from '@/components/ui/generic-form';
import { useRecordAnimalWeight } from '@/queries/animals/mutations';

interface WeighFormProps {
  animalId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  weightKg: string;
  note: string;
}

const schema = yup.object({
  weightKg: yup
    .string()
    .required('Cân nặng là bắt buộc')
    .test('positive', 'Cân nặng phải lớn hơn 0 và không vượt quá 2000 kg', (val) => {
      if (!val) return false;
      const n = parseFloat(val);
      return !isNaN(n) && n > 0 && n <= 2000;
    }),
  note: yup.string(),
}) as yup.ObjectSchema<FormValues>;

export function WeighForm({ animalId, onSuccess, onError }: WeighFormProps): React.JSX.Element {
  const mutation = useRecordAnimalWeight(animalId, { onSuccess, onError });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    await mutation.mutateAsync({ weightKg: parseFloat(data.weightKg), note: data.note || undefined });
  };

  return (
    <GenericForm<FormValues>
      schema={schema}
      defaultValues={{ weightKg: '', note: '' }}
      onSubmit={handleSubmit}
      submitLabel="Ghi nhận"
      resetOnSuccess
    >
      <FormTextField
        name="weightKg"
        label="Cân nặng (kg)"
        placeholder="Nhập cân nặng"
        keyboardType="numeric"
        required
      />
      <FormTextField
        name="note"
        label="Ghi chú (tuỳ chọn)"
        placeholder="Thêm ghi chú..."
        multiline
      />
    </GenericForm>
  );
}
