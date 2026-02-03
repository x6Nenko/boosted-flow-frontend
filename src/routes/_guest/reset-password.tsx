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
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Invalid reset link</h1>
          <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <ResetPasswordForm token={token} />
    </div>
  );
}
