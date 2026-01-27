import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ResetPasswordFormData } from '@/features/auth/auth.schema';
import { resetPasswordSchema } from '@/features/auth/auth.schema';
import { useResetPassword } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';

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
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Password updated
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your password has been reset successfully.
          </p>
        </div>
        <div className="text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Continue to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">
              New Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="New password (8-72 characters)"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Confirm new password"
              {...registerField('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {apiErrorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{apiErrorMessage}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting || resetPassword.isPending}
            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {resetPassword.isPending ? 'Resetting...' : 'Reset password'}
          </button>
        </div>

        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
