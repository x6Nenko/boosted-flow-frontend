import { http, HttpResponse } from 'msw';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

const API_BASE_URL = 'http://localhost:3000';

// Valid JWT for testing (payload: { sub: 'user-123', exp: far future })
export const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0.signature';

export const handlers = [
  // Login
  http.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  // Register
  http.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN }, { status: 201 });
  }),

  // Refresh
  http.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
    // By default, refresh succeeds
    return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN });
  }),

  // Logout
  http.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
