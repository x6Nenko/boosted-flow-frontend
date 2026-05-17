import { redirect } from '@tanstack/react-router';
import { billingStatusQueryOptions } from './hooks';
import type { QueryClient } from '@tanstack/react-query';

export async function requireBillingAccess(queryClient: QueryClient, pathname: string) {
  const status = await queryClient.ensureQueryData(billingStatusQueryOptions);

  if (!status.hasActiveAccess && pathname !== '/billing') {
    throw redirect({ to: '/billing' });
  }
}
