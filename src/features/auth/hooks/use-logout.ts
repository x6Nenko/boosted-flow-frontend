import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from '../api';
import { authStore } from '../auth-store';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      authStore.setAccessToken(null);
      queryClient.clear(); // Clear all cached data
      navigate({ to: '/login' });
    },
    onError: () => {
      // Logout should always clear local state, even on error
      authStore.setAccessToken(null);
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });
}
