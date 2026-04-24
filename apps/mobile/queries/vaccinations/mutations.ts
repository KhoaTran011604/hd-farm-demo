import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';

interface CreateVaccinationInput {
  animalId: string;
  vaccineTypeId: string;
  batchNumber?: string;
  vaccinatedAt: string;
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
    mutationFn: (input) => api.post('/vaccinations', input).then(() => undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vaccinations.byAnimal(animalId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.upcomingVaccinations() });
      callbacks?.onSuccess?.();
    },
    onError: (error) => callbacks?.onError?.(error.message),
  });
}
