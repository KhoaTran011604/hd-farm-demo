import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';

interface CreateDiseaseInput {
  animalId: string;
  diseaseTypeId?: string | null;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms?: string;
  notes?: string;
  diagnosedAt: string;
}

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useCreateDisease(animalId: string, callbacks?: MutationCallbacks) {
  const qc = useQueryClient();
  return useMutation<void, Error, CreateDiseaseInput>({
    mutationFn: (input) => api.post('/diseases', input).then(() => undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.diseases.byAnimal(animalId) });
      void qc.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
      void qc.invalidateQueries({ queryKey: queryKeys.animals.health(animalId) });
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}
