import { queryOptions, useQuery } from '@tanstack/react-query';
import { billingApi } from '../api';

export const billingStatusQueryKey = ['billing', 'status'] as const;

export const billingStatusQueryOptions = queryOptions({
  queryKey: billingStatusQueryKey,
  queryFn: billingApi.getStatus,
  staleTime: 60 * 1000,
});

export function useBillingStatus() {
  return useQuery(billingStatusQueryOptions);
}
