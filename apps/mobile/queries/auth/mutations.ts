import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { saveToken, saveUser } from '@/lib/auth';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useLoginMutation(callbacks?: LoginCallbacks) {
  return useMutation<void, Error, LoginInput>({
    mutationFn: async (input) => {
      const { data } = await api.post('/auth/login', input);
      await saveToken((data as { token: string }).token);
      await saveUser((data as { user: Record<string, unknown> }).user);
    },
    onSuccess: () => callbacks?.onSuccess?.(),
    onError: (error) => callbacks?.onError?.(error.message),
  });
}
