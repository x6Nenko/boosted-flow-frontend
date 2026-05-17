import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { billingApi } from './api';
import { requireBillingAccess } from './billing-guard';
import { openPaddleCheckout } from './paddle';
import type React from 'react';
import { BillingPage } from '@/routes/_auth/billing';
import { authStore } from '@/features/auth/auth-store';
import {
  createExpiredBillingStatus,
  getCheckoutRequestCount,
  handlers,
  resetMockBilling,
  setMockBillingStatus,
} from '@/test/mocks/handlers';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');

  return {
    ...actual,
    redirect: vi.fn((opts) => {
      throw { __isRedirect: true, to: opts.to };
    }),
  };
});

vi.mock('./paddle', () => ({
  openPaddleCheckout: vi.fn(() => Promise.resolve(vi.fn())),
}));

const server = setupServer(...handlers);
const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.sig';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithQueryClient(ui: React.ReactElement, queryClient = createQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockBilling();
  authStore.setAccessToken(VALID_TOKEN);
  vi.clearAllMocks();
});
afterEach(() => {
  server.resetHandlers();
  authStore.setAccessToken(null);
});
afterAll(() => server.close());

describe('billingApi', () => {
  it('returns billing status', async () => {
    await expect(billingApi.getStatus()).resolves.toMatchObject({
      hasActiveTrial: true,
      hasActiveAccess: true,
    });
  });

  it('creates checkout transactions', async () => {
    await expect(billingApi.createCheckout()).resolves.toEqual({
      transactionId: 'txn_test_01',
    });
    expect(getCheckoutRequestCount()).toBe(1);
  });
});

describe('requireBillingAccess', () => {
  it('allows app routes during active trial', async () => {
    const queryClient = createQueryClient();

    await expect(requireBillingAccess(queryClient, '/dashboard')).resolves.toBeUndefined();
  });

  it('redirects app routes to billing when access is expired', async () => {
    const queryClient = createQueryClient();
    setMockBillingStatus(createExpiredBillingStatus());

    await expect(requireBillingAccess(queryClient, '/dashboard')).rejects.toMatchObject({
      __isRedirect: true,
      to: '/billing',
    });
  });

  it('allows billing route when access is expired', async () => {
    const queryClient = createQueryClient();
    setMockBillingStatus(createExpiredBillingStatus());

    await expect(requireBillingAccess(queryClient, '/billing')).resolves.toBeUndefined();
  });
});

describe('BillingPage', () => {
  it('creates checkout and opens Paddle from the expired paywall', async () => {
    setMockBillingStatus(createExpiredBillingStatus());
    renderWithQueryClient(<BillingPage />);

    const subscribeButton = await screen.findByRole('button', { name: /subscribe/i });
    fireEvent.click(subscribeButton);

    await waitFor(() => {
      expect(getCheckoutRequestCount()).toBe(1);
      expect(openPaddleCheckout).toHaveBeenCalledWith('txn_test_01', expect.any(Function));
    });
  });
});
