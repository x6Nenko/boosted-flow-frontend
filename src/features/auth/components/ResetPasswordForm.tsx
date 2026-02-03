import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ResetPasswordFormData } from '@/features/auth/auth.schema';
import { resetPasswordSchema } from '@/features/auth/auth.schema';
import { useResetPassword } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const resetPassword = useResetPassword();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPassword.mutate({ token, password: data.password });
  };

  const apiErrorMessage =
    resetPassword.error instanceof ApiError
      ? (resetPassword.error.data as { message?: string }).message ?? 'Reset failed'
      : resetPassword.error?.message;

  if (resetPassword.isSuccess) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Password updated
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Your password has been reset successfully.
          </p>
        </div>
        <div className="text-center">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Continue to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <form className="mt-8 space-y-6 rounded-xl border border-border bg-card p-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="password" className="sr-only">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="New password (8-72 characters)"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              {...registerField('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {apiErrorMessage && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">{apiErrorMessage}</p>
          </div>
        )}

        <div>
          <Button
            type="submit"
            disabled={isSubmitting || resetPassword.isPending}
            className="w-full"
          >
            {resetPassword.isPending ? 'Resetting...' : 'Reset password'}
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
