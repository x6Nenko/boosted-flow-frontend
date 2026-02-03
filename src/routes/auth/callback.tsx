import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useGoogleAuth } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type AuthCallbackSearch = {
  code?: string;
  error?: string;
};

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>): AuthCallbackSearch => ({
    code: search.code as string | undefined,
    error: search.error as string | undefined,
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { code, error: oauthError } = useSearch({ from: '/auth/callback' });
  const { exchangeCode } = useGoogleAuth();

  useEffect(() => {
    if (oauthError) {
      navigate({ to: '/login' });
      return;
    }

    if (code && !exchangeCode.isPending && !exchangeCode.isSuccess) {
      exchangeCode.mutate(code);
    }
  }, [code, oauthError, navigate, exchangeCode]);

  const errorMessage =
    exchangeCode.error instanceof ApiError
      ? (exchangeCode.error.data as { message?: string })?.message || 'Authentication failed'
      : exchangeCode.error?.message;

  if (exchangeCode.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{errorMessage}</p>
          <Button
            onClick={() => navigate({ to: '/login' })}
            variant="link"
            className="mt-4"
          >
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Completing sign in...</p>
    </div>
  );
}
