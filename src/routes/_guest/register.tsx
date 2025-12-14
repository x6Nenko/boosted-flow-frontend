import { createFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const Route = createFileRoute('/_guest/register')({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}
