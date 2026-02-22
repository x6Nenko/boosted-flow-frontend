import { createFileRoute, redirect } from '@tanstack/react-router';
import { authStore } from '@/features/auth/auth-store';
import { SectionHero } from '@/components/landing/sections/section-hero';
import { SectionNumbers } from '@/components/landing/sections/section-numbers';
import { SectionPricing } from '@/components/landing/sections/section-pricing';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (authStore.isAuthenticated()) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: App,
});

function App() {
  return (
    <>
      <SectionHero />
      <SectionNumbers />
      <SectionPricing />
    </>
  );
}

