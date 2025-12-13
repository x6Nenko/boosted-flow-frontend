import { authStore } from '@/features/auth/auth-store';
import { API_ENDPOINTS } from './api-endpoints';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean; // For auth endpoints that don't need Bearer token
};

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
  ) {
    super(`${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

// Track refresh promise to prevent multiple simultaneous refresh calls
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    authStore.setAccessToken(null);
    throw new ApiError(response.status, 'Token refresh failed');
  }

  const data = await response.json();
  authStore.setAccessToken(data.accessToken);
  return data.accessToken;
}

async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const makeRequest = async (token: string | null): Promise<Response> => {
    const config: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    return fetch(`${API_BASE_URL}${endpoint}`, config);
  };

  let response = await makeRequest(authStore.getAccessToken());

  // If 401 and not an auth endpoint, try to refresh
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    try {
      // Deduplicate refresh calls
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;

      // Retry original request with new token
      response = await makeRequest(newToken);
    } catch {
      refreshPromise = null;
      throw new ApiError(401, 'Unauthorized');
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, data);
  }

  return data as T;
}

export { apiClient, ApiError, API_BASE_URL };
