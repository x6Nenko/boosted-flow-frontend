import { useSyncExternalStore } from 'react';
import { authStore } from '../auth-store';

export function useAuth() {
  const accessToken = useSyncExternalStore(
    authStore.subscribe,
    authStore.getAccessToken,
    authStore.getAccessToken, // Server snapshot (same for SSR)
  );

  return {
    accessToken,
    isAuthenticated: accessToken !== null,
    user: authStore.getUser(),
  };
}
