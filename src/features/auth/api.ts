import { apiClient } from '@/lib/api-client';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  register: (data: RegisterRequest) =>
    apiClient<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  refresh: () =>
    apiClient<AuthResponse>('/auth/refresh', { method: 'POST' }),

  logout: () =>
    apiClient<void>('/auth/logout', { method: 'POST' }),
};
