import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as yup from 'yup';
import { GenericForm, FormTextField } from '@/components/ui/generic-form';
import { useUpdateAnimalStatus } from '@/queries/animals/mutations';
import { TRANSITIONS, TERMINAL_STATUSES, HEALTH_STATUS_LABELS } from '@hd-farm/shared';
import type { HealthStatus } from '@hd-farm/shared';

interface StatusChangeFormProps {
  animalId: string;
  currentStatus: HealthStatus;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface FormValues {
  weightKg: string;
  reason: string;
}

const schema = yup.object({
  weightKg: yup
    .string()
    .test('valid-weight', 'Cân nặng phải từ 0 đến 2000 kg', (val) => {
      if (!val) return true;
      const n = parseFloat(val);
      return !isNaN(n) && n > 0 && n <= 2000;
    }),
  reason: yup.string(),
}) as yup.ObjectSchema<FormValues>;

export function StatusChangeForm({
  animalId,
  currentStatus,
  onSuccess,
  onError,
}: StatusChangeFormProps): React.JSX.Element {
  const [selectedStatus, setSelectedStatus] = useState<HealthStatus | null>(null);
  const allowedStatuses = (TRANSITIONS[currentStatus] ?? []) as HealthStatus[];

  const mutation = useUpdateAnimalStatus(animalId, { onSuccess, onError });

  const handleSubmit = async (data: FormValues): Promise<void> => {
    if (!selectedStatus) {
      onError?.('Vui lòng chọn trạng thái mới');
      return;
    }
    await mutation.mutateAsync({
      status: selectedStatus,
      weightKg: data.weightKg ? parseFloat(data.weightKg) : undefined,
      reason: data.reason || undefined,
    });
  };

  if (allowedStatuses.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Không thể thay đổi trạng thái từ trạng thái hiện tại.</Text>
      </View>
    );
  }

  return (
    <GenericForm<FormValues>
      schema={schema}
      defaultValues={{ weightKg: '', reason: '' }}
      onSubmit={handleSubmit}
      submitLabel="Xác nhận"
      disabled={!selectedStatus}
    >
      <View style={styles.section}>
        <Text style={styles.label}>Trạng thái mới <Text style={styles.required}>*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {allowedStatuses.map((s) => {
              const isTerminal = TERMINAL_STATUSES.includes(s);
              const isSelected = selectedStatus === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    isTerminal && styles.chipTerminal,
                    isSelected && isTerminal && styles.chipTerminalSelected,
                  ]}
                  onPress={() => setSelectedStatus(s)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                    isTerminal && styles.chipTextTerminal,
                    isSelected && isTerminal && styles.chipTextTerminalSelected,
                  ]}>
                    {HEALTH_STATUS_LABELS[s] ?? s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <FormTextField
        name="weightKg"
        label="Cân nặng (kg, tuỳ chọn)"
        placeholder="Nhập cân nặng"
        keyboardType="numeric"
      />

      <FormTextField
        name="reason"
        label="Ghi chú (tuỳ chọn)"
        placeholder="Lý do thay đổi..."
        multiline
      />

      {selectedStatus && TERMINAL_STATUSES.includes(selectedStatus) && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ Đây là trạng thái cuối — không thể hoàn tác sau khi xác nhận.
          </Text>
        </View>
      )}
    </GenericForm>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
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
  chipSelected: { borderColor: '#1a7f37', backgroundColor: '#f0faf3' },
  chipTerminal: { borderColor: '#f87171', backgroundColor: '#fff5f5' },
  chipTerminalSelected: { borderColor: '#d1242f', backgroundColor: '#fee2e2' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#1a7f37' },
  chipTextTerminal: { color: '#d1242f' },
  chipTextTerminalSelected: { color: '#b91c1c' },
  empty: { padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  warning: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningText: { fontSize: 13, color: '#dc2626' },
});
