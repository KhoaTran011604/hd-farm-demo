import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';

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
