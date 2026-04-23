import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';

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
