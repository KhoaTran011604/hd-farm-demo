import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';

interface CreateVaccinationInput {
  animalId: string;
  vaccineTypeId: string;
  batchNumber?: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  notes?: string;
}

interface UpdateVaccinationInput {
  batchNumber?: string;
  vaccinatedAt?: string;
  nextDueAt?: string;
  notes?: string;
}

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useCreateVaccination(animalId: string, callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CreateVaccinationInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/proxy/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Failed to record vaccination');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.vaccinations(animalId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}

export function useUpdateVaccination(animalId: string, callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; input: UpdateVaccinationInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/proxy/vaccinations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Failed to update vaccination');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.vaccinations(animalId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}

export function useDeleteVaccination(animalId: string, callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/proxy/vaccinations/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Failed to delete vaccination');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.vaccinations(animalId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}
