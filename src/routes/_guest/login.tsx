import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const Route = createFileRoute('/_guest/login')({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
