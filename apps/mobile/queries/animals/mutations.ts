import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';
import type { Animal } from '@/lib/types';

interface CreateAnimalInput {
  name: string;
  species: 'heo' | 'gà' | 'bò';
  penId: string;
  qrCode?: string;
}

interface CreateAnimalCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useCreateAnimal(callbacks?: CreateAnimalCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CreateAnimalInput>({
    mutationFn: (input) => api.post('/animals', input).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all });
      callbacks?.onSuccess?.();
    },
    onError: (error) => {
      callbacks?.onError?.(error.message);
    },
  });
}

interface UpdateStatusInput {
  status: string;
  weightKg?: number;
  reason?: string;
}

interface UpdateStatusCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useUpdateAnimalStatus(animalId: string, callbacks?: UpdateStatusCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateStatusInput>({
    mutationFn: (input) =>
      api.patch(`/animals/${animalId}/status`, input).then(() => undefined),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.animals.detail(animalId) });
      const previous = queryClient.getQueryData<Animal>(queryKeys.animals.detail(animalId));
      if (previous) {
        queryClient.setQueryData<Animal>(queryKeys.animals.detail(animalId), {
          ...previous,
          status: input.status as Animal['status'],
        });
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      const ctx = context as { previous?: Animal } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.animals.detail(animalId), ctx.previous);
      }
      callbacks?.onError?.(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.health(animalId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all });
      callbacks?.onSuccess?.();
    },
  });
}

interface RecordWeightInput {
  weightKg: number;
  note?: string;
}

interface RecordWeightCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useRecordAnimalWeight(animalId: string, callbacks?: RecordWeightCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RecordWeightInput>({
    mutationFn: (input) =>
      api.post(`/animals/${animalId}/weight`, input).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.health(animalId) });
      callbacks?.onSuccess?.();
    },
    onError: (error) => {
      callbacks?.onError?.(error.message);
    },
  });
}
