import { Link, createFileRoute } from '@tanstack/react-router';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const Route = createFileRoute('/_guest/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
          <p className="text-gray-600">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <ResetPasswordForm token={token} />
    </div>
  );
}
