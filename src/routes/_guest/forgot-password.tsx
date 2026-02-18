import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const Route = createFileRoute('/_guest/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center max-sm:px-2 px-4 py-12">
      <ForgotPasswordForm />
    </div>
  );
}
