import { HttpResponse, http } from 'msw';
import type { BillingStatus } from '@/features/billing/types';
import type { TimeEntry } from '@/features/time-entries/types';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

const API_BASE_URL = 'http://localhost:3000';

// Valid JWT for testing (payload: { sub: 'user-123', exp: far future })
export const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0.signature';

// Mock time entries state
let mockTimeEntries: Array<TimeEntry> = [];
let entryIdCounter = 1;
let mockBillingStatus: BillingStatus = createActiveTrialBillingStatus();
let checkoutRequestCount = 0;

export const resetMockTimeEntries = () => {
  mockTimeEntries = [];
  entryIdCounter = 1;
};

function createActiveTrialBillingStatus(): BillingStatus {
  return {
    hasActiveSubscription: false,
    hasActiveTrial: true,
    hasActiveAccess: true,
    trial: {
      status: 'active',
      startedAt: '2026-05-01T00:00:00.000Z',
      endsAt: '2026-05-15T00:00:00.000Z',
    },
    subscription: null,
  };
}

function cloneBillingStatus(status: BillingStatus): BillingStatus {
  return {
    ...status,
    trial: { ...status.trial },
    subscription: status.subscription ? { ...status.subscription } : null,
  };
}

export const createExpiredBillingStatus = (): BillingStatus => ({
  hasActiveSubscription: false,
  hasActiveTrial: false,
  hasActiveAccess: false,
  trial: {
    status: 'expired',
    startedAt: '2026-04-01T00:00:00.000Z',
    endsAt: '2026-04-15T00:00:00.000Z',
  },
  subscription: null,
});

export const resetMockBilling = () => {
  mockBillingStatus = createActiveTrialBillingStatus();
  checkoutRequestCount = 0;
};

export const setMockBillingStatus = (status: BillingStatus) => {
  mockBillingStatus = cloneBillingStatus(status);
};

export const getCheckoutRequestCount = () => checkoutRequestCount;

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

  http.get(`${API_BASE_URL}${API_ENDPOINTS.BILLING.STATUS}`, () => {
    return HttpResponse.json(cloneBillingStatus(mockBillingStatus));
  }),

  http.post(`${API_BASE_URL}${API_ENDPOINTS.BILLING.CHECKOUT}`, () => {
    checkoutRequestCount += 1;
    return HttpResponse.json({ transactionId: 'txn_test_01' });
  }),

  // Time Entries - Start
  http.post(`${API_BASE_URL}${API_ENDPOINTS.TIME_ENTRIES.START}`, async ({ request }) => {
    const activeEntry = mockTimeEntries.find((e) => !e.stoppedAt);
    if (activeEntry) {
      return HttpResponse.json({ message: 'Already have an active timer' }, { status: 409 });
    }

    const body = (await request.json().catch(() => ({}))) as { activityId: string; description?: string };
    const entry: TimeEntry = {
      id: `entry-${entryIdCounter++}`,
      userId: 'user-123',
      activityId: body.activityId,
      description: body.description || null,
      startedAt: new Date().toISOString(),
      stoppedAt: null,
      rating: null,
      comment: null,
      distractionCount: 0,
      createdAt: new Date().toISOString(),
    };
    mockTimeEntries.unshift(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),

  // Time Entries - Stop
  http.post(`${API_BASE_URL}${API_ENDPOINTS.TIME_ENTRIES.STOP}`, async ({ request }) => {
    const body = (await request.json()) as { id: string };
    const entry = mockTimeEntries.find((e) => e.id === body.id);

    if (!entry) {
      return HttpResponse.json({ message: 'Entry not found' }, { status: 404 });
    }
    if (entry.stoppedAt) {
      return HttpResponse.json({ message: 'Entry already stopped' }, { status: 409 });
    }

    entry.stoppedAt = new Date().toISOString();
    return HttpResponse.json(entry);
  }),

  // Time Entries - List
  http.get(`${API_BASE_URL}${API_ENDPOINTS.TIME_ENTRIES.LIST}`, ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let filtered = [...mockTimeEntries];
    if (from) {
      filtered = filtered.filter((e) => e.startedAt >= from);
    }
    if (to) {
      filtered = filtered.filter((e) => e.startedAt <= to);
    }

    return HttpResponse.json(filtered);
  }),

  // Time Entries - Current
  http.get(`${API_BASE_URL}${API_ENDPOINTS.TIME_ENTRIES.CURRENT}`, () => {
    const activeEntry = mockTimeEntries.find((e) => !e.stoppedAt) || null;
    return HttpResponse.json({ entry: activeEntry });
  }),
];
