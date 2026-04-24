import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { GenericForm, FormTextField } from '@/components/ui/generic-form';
import { useCreateVaccination } from '@/queries/vaccinations/mutations';
import { queryKeys } from '@/queries/keys';
import { api } from '@/lib/api';

interface VaccineTypeOption {
  id: string;
  name: string;
  intervalDays: number | null;
}

interface VaccinationFormProps {
  animalId: string;
  prefilledVaccineTypeId?: string;
  prefilledVaccineName?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  batchNumber: string;
  vaccinatedAt: string;
  notes: string;
}

const schema = yup.object({
  batchNumber: yup.string(),
  vaccinatedAt: yup.string().required('Ngày tiêm là bắt buộc'),
  notes: yup.string(),
}) as yup.ObjectSchema<FormValues>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface InnerProps {
  vaccineTypes: VaccineTypeOption[];
  selectedTypeId: string;
  setSelectedTypeId: (id: string) => void;
  prefilledVaccineTypeId?: string;
  prefilledVaccineName?: string;
}

function VaccinationFormInner({
  vaccineTypes,
  selectedTypeId,
  setSelectedTypeId,
  prefilledVaccineTypeId,
  prefilledVaccineName,
}: InnerProps): React.JSX.Element {
  const vaccinatedAt = useWatch<FormValues, 'vaccinatedAt'>({ name: 'vaccinatedAt' });
  const selectedType = vaccineTypes.find((vt) => vt.id === selectedTypeId);
  const autoNextDue = selectedType?.intervalDays
    ? addDays(vaccinatedAt || todayISO(), selectedType.intervalDays)
    : null;

  return (
    <>
      {prefilledVaccineTypeId ? (
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyLabel}>Loại vaccine</Text>
          <Text style={styles.readonlyValue}>{prefilledVaccineName ?? prefilledVaccineTypeId}</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Loại vaccine <Text style={styles.required}>*</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {vaccineTypes.map((vt) => (
                <TouchableOpacity
                  key={vt.id}
                  style={[styles.chip, selectedTypeId === vt.id && styles.chipSelected]}
                  onPress={() => setSelectedTypeId(vt.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, selectedTypeId === vt.id && styles.chipTextSelected]}>
                    {vt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <FormTextField
        name="vaccinatedAt"
        label="Ngày tiêm (YYYY-MM-DD)"
        placeholder={todayISO()}
        required
      />

      {autoNextDue && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Lần tiêm tiếp theo: {autoNextDue}</Text>
        </View>
      )}

      <FormTextField
        name="batchNumber"
        label="Số lô vaccine (tuỳ chọn)"
        placeholder="VD: LOT-2024-001"
      />

      <FormTextField
        name="notes"
        label="Ghi chú (tuỳ chọn)"
        placeholder="Thêm ghi chú..."
        multiline
      />
    </>
  );
}

export function VaccinationForm({
  animalId,
  prefilledVaccineTypeId,
  prefilledVaccineName,
  onSuccess,
  onError,
}: VaccinationFormProps): React.JSX.Element {
  const [selectedTypeId, setSelectedTypeId] = useState(prefilledVaccineTypeId ?? '');

  const { data: vaccineTypes = [] } = useQuery<VaccineTypeOption[]>({
    queryKey: queryKeys.config.vaccineTypes,
    queryFn: () => api.get('/config/vaccine-types').then((r) => r.data as VaccineTypeOption[]),
    enabled: !prefilledVaccineTypeId,
  });

  const mutation = useCreateVaccination(animalId, { onSuccess, onError });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    if (!selectedTypeId) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại vaccine');
      return;
    }
    const selectedType = vaccineTypes.find((vt) => vt.id === selectedTypeId);
    const autoNextDue = selectedType?.intervalDays
      ? addDays(data.vaccinatedAt, selectedType.intervalDays)
      : undefined;

    await mutation.mutateAsync({
      animalId,
      vaccineTypeId: selectedTypeId,
      batchNumber: data.batchNumber || undefined,
      vaccinatedAt: data.vaccinatedAt,
      nextDueAt: autoNextDue,
      notes: data.notes || undefined,
    });
  };

  return (
    <GenericForm<FormValues>
      schema={schema}
      defaultValues={{ batchNumber: '', vaccinatedAt: todayISO(), notes: '' }}
      onSubmit={handleSubmit}
      submitLabel="Ghi nhận tiêm"
    >
      <VaccinationFormInner
        vaccineTypes={vaccineTypes}
        selectedTypeId={selectedTypeId}
        setSelectedTypeId={setSelectedTypeId}
        prefilledVaccineTypeId={prefilledVaccineTypeId}
        prefilledVaccineName={prefilledVaccineName}
      />
    </GenericForm>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  required: { color: '#d1242f' },
  chipScroll: { flexGrow: 0 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  chipSelected: { borderColor: '#1A3009', backgroundColor: '#f0faf3' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#1A3009' },
  readonlyField: { gap: 4 },
  readonlyLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  readonlyValue: {
    fontSize: 15,
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  infoBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0faf3',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoText: { fontSize: 13, color: '#1A3009' },
});
