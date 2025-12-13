import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authStore } from '@/features/auth/auth-store';

export const Route = createFileRoute('/_guest')({
  beforeLoad: () => {
    if (authStore.isAuthenticated()) {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
