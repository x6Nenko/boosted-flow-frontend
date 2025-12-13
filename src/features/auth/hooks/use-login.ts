import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from '../api';
import { authStore } from '../auth-store';
import type { LoginRequest } from '../types';

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      authStore.setAccessToken(response.accessToken);
      navigate({ to: '/dashboard' }); // Redirect to dashboard
    },
  });
}
