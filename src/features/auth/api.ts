import type {
  AuthResponse,
  ExchangeCodeRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from './types';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { method: 'POST', body: data }),
  register: (data: RegisterRequest) =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, { method: 'POST', body: data }),
  refresh: () =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, { method: 'POST' }),
  logout: () =>
    apiClient<void>(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' }),
  exchangeCode: (data: ExchangeCodeRequest) =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.EXCHANGE, { method: 'POST', body: data }),
  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient<MessageResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { method: 'POST', body: data }),
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient<MessageResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { method: 'POST', body: data }),
};
