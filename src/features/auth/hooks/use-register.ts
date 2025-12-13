import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from '../api';
import { authStore } from '../auth-store';
import type { RegisterRequest } from '../types';

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      authStore.setAccessToken(response.accessToken);
      navigate({ to: '/dashboard' }); // Redirect to dashboard
    },
  });
}
