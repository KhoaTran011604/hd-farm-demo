import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as yup from 'yup';
import { GenericForm, FormTextField } from '@/components/ui/generic-form';
import { useCreateDisease } from '@/queries/diseases/mutations';
import { useDiseaseTypesQuery } from '@/queries/diseases/queries';
import { DISEASE_SEVERITIES, DISEASE_SEVERITY_LABELS } from '@hd-farm/shared';
import type { DiseaseSeverity } from '@hd-farm/shared';

interface DiseaseReportFormProps {
  animalId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  symptoms: string;
  notes: string;
  diagnosedAt: string;
}

const schema = yup.object({
  symptoms: yup.string(),
  notes: yup.string(),
  diagnosedAt: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng YYYY-MM-DD')
    .required('Ngày chẩn đoán là bắt buộc'),
}) as yup.ObjectSchema<FormValues>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const QUICK_SYMPTOM_CHIPS = [
  'Sốt',
  'Bỏ ăn',
  'Ủ rũ',
  'Ho',
  'Khó thở',
  'Tiêu chảy',
  'Co giật',
  'Sưng',
];

export function DiseaseReportForm({
  animalId,
  onSuccess,
  onError,
}: DiseaseReportFormProps): React.JSX.Element {
  const [diseaseTypeId, setDiseaseTypeId] = useState<string>('');
  const [severity, setSeverity] = useState<DiseaseSeverity>('mild');
  const [symptomsChips, setSymptomsChips] = useState<string[]>([]);

  const { data: diseaseTypes = [] } = useDiseaseTypesQuery();
  const mutation = useCreateDisease(animalId, { onSuccess, onError });

  const toggleChip = (sym: string) => {
    setSymptomsChips((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym],
    );
  };

  const handleSubmit = async (data: FormValues): Promise<void> => {
    const chipStr = symptomsChips.join(', ');
    const combined = [chipStr, data.symptoms].filter(Boolean).join(' — ');

    await mutation.mutateAsync({
      animalId,
      diseaseTypeId: diseaseTypeId || null,
      severity,
      symptoms: combined || undefined,
      notes: data.notes || undefined,
      diagnosedAt: data.diagnosedAt,
    });
  };

  return (
    <GenericForm<FormValues>
      schema={schema}
      defaultValues={{ symptoms: '', notes: '', diagnosedAt: todayISO() }}
      onSubmit={handleSubmit}
      submitLabel="Ghi nhận bệnh"
    >
      {diseaseTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Loại bệnh (tuỳ chọn)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {diseaseTypes.map((dt) => (
                <TouchableOpacity
                  key={dt.id}
                  style={[styles.chip, diseaseTypeId === dt.id && styles.chipSelected]}
                  onPress={() => setDiseaseTypeId(diseaseTypeId === dt.id ? '' : dt.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.chipText, diseaseTypeId === dt.id && styles.chipTextSelected]}
                  >
                    {dt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Mức độ <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.chipRow}>
          {DISEASE_SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                severity === s && styles.chipSelected,
                s === 'severe' && severity === s && styles.chipSevere,
              ]}
              onPress={() => setSeverity(s)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, severity === s && styles.chipTextSelected]}>
                {DISEASE_SEVERITY_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Triệu chứng nhanh</Text>
        <View style={styles.chipRowWrap}>
          {QUICK_SYMPTOM_CHIPS.map((sym) => {
            const active = symptomsChips.includes(sym);
            return (
              <TouchableOpacity
                key={sym}
                style={[styles.chip, active && styles.chipSelected]}
                onPress={() => toggleChip(sym)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextSelected]}>{sym}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FormTextField
        name="symptoms"
        label="Triệu chứng khác (tuỳ chọn)"
        placeholder="Mô tả triệu chứng..."
        multiline
      />

      <FormTextField
        name="diagnosedAt"
        label="Ngày chẩn đoán (YYYY-MM-DD)"
        placeholder={todayISO()}
        required
      />

      <FormTextField name="notes" label="Ghi chú (tuỳ chọn)" placeholder="Ghi chú thêm..." multiline />

      {severity !== 'mild' && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ Mức độ {DISEASE_SEVERITY_LABELS[severity].toLowerCase()} — trạng thái vật nuôi sẽ tự
            động chuyển sang "Bị bệnh".
          </Text>
        </View>
      )}
    </GenericForm>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8, marginBottom: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  required: { color: '#d1242f' },
  chipScroll: { flexGrow: 0 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  chipSelected: { borderColor: '#1A3009', backgroundColor: '#f0faf3' },
  chipSevere: { borderColor: '#d1242f', backgroundColor: '#fee2e2' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#1A3009' },
  warning: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningText: { fontSize: 13, color: '#dc2626' },
});
