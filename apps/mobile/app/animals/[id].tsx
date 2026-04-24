import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WeighForm } from '@/components/quick-forms/weigh-form';
import { StatusChangeForm } from '@/components/quick-forms/status-change-form';
import { VaccinationForm } from '@/components/quick-forms/vaccination-form';
import { useAnimalDetailQuery } from '@/queries/animals/queries';
import type { HealthStatus } from '@hd-farm/shared';

type QuickAction = 'weigh' | 'status' | 'vaccinate' | null;

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AnimalDetailScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const { data: animal, isLoading, isError } = useAnimalDetailQuery(id);
  const [activeAction, setActiveAction] = useState<QuickAction>(null);

  useEffect(() => {
    if (action === 'weigh' || action === 'status' || action === 'vaccinate') {
      setActiveAction(action);
    }
  }, [action]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1A3009" size="large" />
      </View>
    );
  }

  if (isError || !animal) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Animal not found.</Text>
      </View>
    );
  }

  const updatedAt = new Date(animal.updatedAt).toLocaleDateString();
  const createdAt = new Date(animal.createdAt).toLocaleDateString();

  const handleSuccess = (action: QuickAction) => {
    setActiveAction(null);
    const messages: Record<NonNullable<QuickAction>, string> = {
      weigh: 'Đã ghi nhận cân nặng',
      status: 'Đã cập nhật trạng thái',
      vaccinate: 'Đã ghi nhận mũi tiêm',
    };
    if (action) Alert.alert('Thành công', messages[action]);
  };

  const handleError = (msg: string) => {
    Alert.alert('Lỗi', msg);
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{animal.name}</Text>
            <Badge status={animal.status} />
          </View>
          <Text style={styles.species}>{animal.species}</Text>
          {animal.zoneName ?? animal.penName ? (
            <Text style={styles.location}>
              {[animal.farmName, animal.zoneName, animal.penName].filter(Boolean).join(' › ')}
            </Text>
          ) : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <FieldRow label="QR Code" value={animal.qrCode} />
          <FieldRow label="Species" value={animal.species} />
          <FieldRow label="Status" value={animal.status} />
          <FieldRow label="Created" value={createdAt} />
          <FieldRow label="Updated" value={updatedAt} />
        </Card>

        {animal.typeMetadata && Object.keys(animal.typeMetadata).length > 0 ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            {Object.entries(animal.typeMetadata).map(([k, v]) => (
              <FieldRow key={k} label={k} value={typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)} />
            ))}
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <Button
              label="Cân"
              variant="secondary"
              onPress={() => setActiveAction('weigh')}
              style={styles.actionBtn}
            />
            <Button
              label="Trạng thái"
              variant="secondary"
              onPress={() => setActiveAction('status')}
              style={styles.actionBtn}
            />
            <Button
              label="Tiêm"
              variant="secondary"
              onPress={() => setActiveAction('vaccinate')}
              style={styles.actionBtn}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Weigh modal */}
      <QuickActionModal
        visible={activeAction === 'weigh'}
        title="Ghi nhận cân nặng"
        onClose={() => setActiveAction(null)}
      >
        <WeighForm
          animalId={animal.id}
          onSuccess={() => handleSuccess('weigh')}
          onError={handleError}
        />
      </QuickActionModal>

      {/* Status change modal */}
      <QuickActionModal
        visible={activeAction === 'status'}
        title="Thay đổi trạng thái"
        onClose={() => setActiveAction(null)}
      >
        <StatusChangeForm
          animalId={animal.id}
          currentStatus={animal.status as HealthStatus}
          onSuccess={() => handleSuccess('status')}
          onError={handleError}
        />
      </QuickActionModal>

      {/* Vaccination modal */}
      <QuickActionModal
        visible={activeAction === 'vaccinate'}
        title="Ghi nhận tiêm vaccine"
        onClose={() => setActiveAction(null)}
      >
        <VaccinationForm
          animalId={animal.id}
          onSuccess={() => handleSuccess('vaccinate')}
          onError={handleError}
        />
      </QuickActionModal>
    </>
  );
}

function QuickActionModal({
  visible, title, onClose, children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.modalBody}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280' },
  headerCard: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  species: { fontSize: 14, color: '#6b7280', textTransform: 'capitalize' },
  location: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldLabel: { fontSize: 14, color: '#6b7280' },
  fieldValue: { fontSize: 14, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  modalClose: { fontSize: 18, color: '#6b7280', fontWeight: '500' },
  modalBody: { padding: 16 },
});
