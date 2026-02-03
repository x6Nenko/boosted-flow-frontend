import { createFileRoute, redirect } from '@tanstack/react-router';
import { authStore } from '@/features/auth/auth-store';
import Hero from '@/components/landing/Hero';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (authStore.isAuthenticated()) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: App,
});

function App() {
  return <Hero />;
}

