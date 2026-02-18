import { createFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const Route = createFileRoute('/_guest/register')({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center max-sm:px-2 px-4 py-12">
      <RegisterForm />
    </div>
  );
}
