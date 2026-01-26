import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from '../api';
import { authStore } from '../auth-store';
import { API_BASE_URL } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export function useGoogleAuth() {
  const navigate = useNavigate();

  const exchangeCode = useMutation({
    mutationFn: (code: string) => authApi.exchangeCode({ code }),
    onSuccess: (response) => {
      authStore.setAccessToken(response.accessToken);
      navigate({ to: '/dashboard' });
    },
  });

  const initiateGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
  };

  return {
    initiateGoogleAuth,
    exchangeCode,
  };
}
