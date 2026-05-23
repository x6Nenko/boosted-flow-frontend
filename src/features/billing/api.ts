import type { BillingStatus, CheckoutResponse, PortalSessionResponse } from './types';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const billingApi = {
  getStatus: () => apiClient<BillingStatus>(API_ENDPOINTS.BILLING.STATUS),
  createCheckout: () =>
    apiClient<CheckoutResponse>(API_ENDPOINTS.BILLING.CHECKOUT, {
      method: 'POST',
    }),
  createPortalSession: () =>
    apiClient<PortalSessionResponse>(API_ENDPOINTS.BILLING.PORTAL_SESSION, {
      method: 'POST',
    }),
};
