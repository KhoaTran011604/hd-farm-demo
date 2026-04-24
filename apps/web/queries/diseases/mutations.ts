import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

interface CreateDiseaseInput {
  animalId: string;
  diseaseTypeId?: string | null;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms?: string;
  notes?: string;
  diagnosedAt: string;
}

interface UpdateDiseaseInput {
  severity?: 'mild' | 'moderate' | 'severe';
  symptoms?: string;
  notes?: string;
  diagnosedAt?: string;
  resolvedAt?: string | null;
}

interface CreateTreatmentInput {
  animalId: string;
  diseaseRecordId?: string | null;
  medicine: string;
  dosage?: string;
  withdrawalDays?: number;
  treatedAt: string;
  endedAt?: string | null;
  notes?: string;
}

interface UpdateTreatmentInput {
  medicine?: string;
  dosage?: string;
  withdrawalDays?: number | null;
  treatedAt?: string;
  endedAt?: string | null;
  notes?: string;
}

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

function invalidateDiseaseData(qc: ReturnType<typeof useQueryClient>, animalId: string) {
  void qc.invalidateQueries({ queryKey: queryKeys.animals.diseases(animalId) });
  void qc.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
  void qc.invalidateQueries({ queryKey: queryKeys.animals.health(animalId) });
  void qc.invalidateQueries({ queryKey: queryKeys.animals.withdrawals(animalId) });
}

export function useCreateDisease(animalId: string, callbacks?: MutationCallbacks) {
  const qc = useQueryClient();
  return useMutation<void, Error, CreateDiseaseInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/proxy/diseases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to record disease');
      }
    },
    onSuccess: () => {
      invalidateDiseaseData(qc, animalId);
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}

export function useUpdateDisease(animalId: string, callbacks?: MutationCallbacks) {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; input: UpdateDiseaseInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/proxy/diseases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to update disease');
      }
    },
    onSuccess: () => {
      invalidateDiseaseData(qc, animalId);
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}

export function useCreateTreatment(
  animalId: string,
  diseaseId: string | undefined,
  callbacks?: MutationCallbacks,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, CreateTreatmentInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/proxy/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to record treatment');
      }
    },
    onSuccess: () => {
      invalidateDiseaseData(qc, animalId);
      if (diseaseId) {
        void qc.invalidateQueries({ queryKey: queryKeys.diseases.treatments(diseaseId) });
      }
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}

export function useUpdateTreatment(
  animalId: string,
  diseaseId: string | undefined,
  callbacks?: MutationCallbacks,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; input: UpdateTreatmentInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/proxy/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to update treatment');
      }
    },
    onSuccess: () => {
      invalidateDiseaseData(qc, animalId);
      if (diseaseId) {
        void qc.invalidateQueries({ queryKey: queryKeys.diseases.treatments(diseaseId) });
      }
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}

export function useDeleteTreatment(
  animalId: string,
  diseaseId: string | undefined,
  callbacks?: MutationCallbacks,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/proxy/treatments/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'Failed to delete treatment');
      }
    },
    onSuccess: () => {
      invalidateDiseaseData(qc, animalId);
      if (diseaseId) {
        void qc.invalidateQueries({ queryKey: queryKeys.diseases.treatments(diseaseId) });
      }
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}
