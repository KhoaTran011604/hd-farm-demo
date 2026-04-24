import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';
import type { AnimalRow } from '@/lib/animal-types';

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
    mutationFn: async (input) => {
      const res = await fetch('/api/proxy/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Không thể tạo vật nuôi');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.all });
      callbacks?.onSuccess?.();
    },
    onError: (error) => {
      callbacks?.onError?.(error.message);
    },
  });
}

interface UpdateAnimalInput {
  name?: string;
  penId?: string;
}

interface UpdateAnimalCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useUpdateAnimal(animalId: string, callbacks?: UpdateAnimalCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateAnimalInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/proxy/animals/${animalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Không thể cập nhật vật nuôi');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
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
    mutationFn: async (input) => {
      const res = await fetch(`/api/proxy/animals/${animalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Không thể cập nhật trạng thái');
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.animals.detail(animalId) });
      const previous = queryClient.getQueryData<AnimalRow>(queryKeys.animals.detail(animalId));
      if (previous) {
        queryClient.setQueryData<AnimalRow>(queryKeys.animals.detail(animalId), {
          ...previous,
          status: input.status as AnimalRow['status'],
        });
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      const ctx = context as { previous?: AnimalRow } | undefined;
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
    mutationFn: async (input) => {
      const res = await fetch(`/api/proxy/animals/${animalId}/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Không thể ghi nhận cân nặng');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.health(animalId) });
      callbacks?.onSuccess?.();
    },
    onError: (error) => {
      callbacks?.onError?.(error.message);
    },
  });
}
