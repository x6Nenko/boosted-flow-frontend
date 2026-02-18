import { NavLink } from '@/components/primitives/nav-link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginFormData } from '@/features/auth/auth.schema';
import { loginSchema } from '@/features/auth/auth.schema';
import { useLogin } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/primitives/password-input';

import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginForm() {
  const login = useLogin();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data);
  };

  const apiErrorMessage =
    login.error instanceof ApiError
      ? (login.error.data as { message?: string })?.message || 'Login failed'
      : login.error?.message;

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
      </div>

      <form className="mt-8 space-y-6 rounded-xl border border-border bg-card max-sm:p-6 p-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <Label htmlFor="email" className="sr-only">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              className="focus-visible:border-white/50 focus-visible:outline-white/50"
              {...registerField('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Password"
              className="focus-visible:border-white/50 focus-visible:outline-white/50"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="text-right text-sm">
          <NavLink to="/forgot-password" className="font-medium text-white hover:text-white/80">
            Forgot your password?
          </NavLink>
        </div>

        {apiErrorMessage && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">{apiErrorMessage}</p>
          </div>
        )}

        <div>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || login.isPending}
            className="w-full cursor-pointer"
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <GoogleSignInButton disabled={login.isPending} />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <NavLink to="/register" className="font-medium text-white hover:text-white/80">
            Register
          </NavLink>
        </div>
      </form>
    </div>
  );
}
