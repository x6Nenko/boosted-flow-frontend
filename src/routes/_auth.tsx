import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authStore } from '@/features/auth/auth-store';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!authStore.isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => <Outlet />,
});
