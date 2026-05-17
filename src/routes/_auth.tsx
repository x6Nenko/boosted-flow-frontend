import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { authStore } from '@/features/auth/auth-store';
import { requireBillingAccess } from '@/features/billing/billing-guard';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    if (!authStore.isAuthenticated()) {
      throw redirect({ to: '/login' });
    }

    await requireBillingAccess(context.queryClient, location.pathname);
  },
  component: () => <Outlet />,
});
