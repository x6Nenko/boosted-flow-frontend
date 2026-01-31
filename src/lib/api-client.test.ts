import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient, ApiError } from './api-client';
import { authStore } from '@/features/auth/auth-store';
import { API_ENDPOINTS } from './api-endpoints';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MOCK_TOKEN = 'initial-token';
const REFRESHED_TOKEN = 'refreshed-token';

// Setup MSW server
const server = setupServer(
  // Protected endpoint - returns 401 if no valid token
  http.get(`${API_BASE_URL}/protected`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || authHeader === 'Bearer expired-token') {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({ data: 'protected-data' });
  }),

  // Refresh endpoint
  http.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
    return HttpResponse.json({ accessToken: REFRESHED_TOKEN });
  }),

  // Public endpoint
  http.get(`${API_BASE_URL}/public`, () => {
    return HttpResponse.json({ data: 'public-data' });
  }),

  // Error endpoint
  http.get(`${API_BASE_URL}/error`, () => {
    return HttpResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }),

  // No content endpoint
  http.delete(`${API_BASE_URL}/resource`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authStore.setAccessToken(null);
});
afterAll(() => server.close());

describe('apiClient', () => {
  describe('basic requests', () => {
    it('makes GET request and returns data', async () => {
      const result = await apiClient<{ data: string }>('/public');
      expect(result).toEqual({ data: 'public-data' });
    });

    it('handles 204 No Content', async () => {
      const result = await apiClient('/resource', { method: 'DELETE' });
      expect(result).toBeUndefined();
    });

    it('throws ApiError on error response', async () => {
      await expect(apiClient('/error')).rejects.toThrow(ApiError);

      try {
        await apiClient('/error');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(500);
        expect((e as ApiError).data).toEqual({ message: 'Something went wrong' });
      }
    });
  });

  describe('authorization header', () => {
    it('attaches Bearer token when authenticated', async () => {
      authStore.setAccessToken(MOCK_TOKEN);

      // Override handler to check auth header
      server.use(
        http.get(`${API_BASE_URL}/check-auth`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ authHeader });
        }),
      );

      const result = await apiClient<{ authHeader: string }>('/check-auth');
      expect(result.authHeader).toBe(`Bearer ${MOCK_TOKEN}`);
    });

    it('does not attach token when not authenticated', async () => {
      server.use(
        http.get(`${API_BASE_URL}/check-auth`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ authHeader });
        }),
      );

      const result = await apiClient<{ authHeader: string | null }>('/check-auth');
      expect(result.authHeader).toBeNull();
    });
  });

  describe('automatic token refresh', () => {
    it('refreshes token on 401 and retries request', async () => {
      // Start with expired token
      authStore.setAccessToken('expired-token');

      const result = await apiClient<{ data: string }>('/protected');

      expect(result).toEqual({ data: 'protected-data' });
      expect(authStore.getAccessToken()).toBe(REFRESHED_TOKEN);
    });

    it('does not refresh for auth endpoints (prevents infinite loop)', async () => {
      authStore.setAccessToken('expired-token');

      // Auth endpoint that returns 401
      server.use(
        http.post(`${API_BASE_URL}/auth/verify`, () => {
          return HttpResponse.json({ message: 'Invalid' }, { status: 401 });
        }),
      );

      await expect(apiClient('/auth/verify', { method: 'POST' })).rejects.toThrow(ApiError);
    });

    it('clears token and throws when refresh fails', async () => {
      authStore.setAccessToken('expired-token');

      // Make refresh fail
      server.use(
        http.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
          return HttpResponse.json({ message: 'Refresh failed' }, { status: 401 });
        }),
      );

      await expect(apiClient('/protected')).rejects.toThrow(ApiError);
      expect(authStore.getAccessToken()).toBeNull();
    });
  });
});
