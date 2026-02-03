import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ForgotPasswordFormData } from '@/features/auth/auth.schema';
import { forgotPasswordSchema } from '@/features/auth/auth.schema';
import { useForgotPassword } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword.mutate(data);
  };

  const apiErrorMessage =
    forgotPassword.error instanceof ApiError
      ? (forgotPassword.error.data as { message?: string }).message ?? 'Request failed'
      : forgotPassword.error?.message;

  if (forgotPassword.isSuccess) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            If an account exists with that email, we've sent password reset instructions.
          </p>
        </div>
        <div className="text-center">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form className="mt-8 space-y-6 rounded-xl border border-border bg-card p-8" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="email" className="sr-only">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            {...registerField('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {apiErrorMessage && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">{apiErrorMessage}</p>
          </div>
        )}

        <div>
          <Button
            type="submit"
            disabled={isSubmitting || forgotPassword.isPending}
            className="w-full"
          >
            {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
          </Button>
        </div>

        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
