import { redirect } from '@tanstack/react-router';
import { authStore } from './auth-store';
import { authApi } from './api';

// Attempt to restore session on app load
export async function initializeAuth(): Promise<void> {
  // If we already have a token, we're good
  if (authStore.getAccessToken()) {
    return;
  }

  // Try to refresh - this will work if there's a valid refresh token cookie
  try {
    const response = await authApi.refresh();
    authStore.setAccessToken(response.accessToken);
  } catch {
    // No valid session, user needs to login
    authStore.setAccessToken(null);
  }
}

// Route guard for protected routes
export function requireAuth() {
  if (!authStore.isAuthenticated()) {
    throw redirect({ to: '/login' });
  }
}

// Route guard for guest-only routes (login, register)
export function requireGuest() {
  if (authStore.isAuthenticated()) {
    throw redirect({ to: '/' });
  }
}
