import { NavLink } from '@/components/primitives/nav-link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RegisterFormData } from '@/features/auth/auth.schema';
import { registerSchema } from '@/features/auth/auth.schema';
import { useRegister } from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { GoogleSignInButton } from './GoogleSignInButton';

export function RegisterForm() {
  const register = useRegister();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    register.mutate({ email: data.email, password: data.password });
  };

  const apiErrorMessage =
    register.error instanceof ApiError
      ? (register.error.data as { message?: string })?.message || 'Registration failed'
      : register.error?.message;

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
      </div>

      <form className="mt-8 space-y-6 rounded-xl border border-border bg-card p-8" onSubmit={handleSubmit(onSubmit)}>
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
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Password (8-72 characters)"
              className="focus-visible:border-white/50 focus-visible:outline-white/50"
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
              placeholder="Confirm password"
              className="focus-visible:border-white/50 focus-visible:outline-white/50"
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
            variant="primary"
            disabled={isSubmitting || register.isPending}
            className="w-full cursor-pointer"
          >
            {register.isPending ? 'Creating account...' : 'Register'}
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

        <GoogleSignInButton mode="signup" disabled={register.isPending} />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <NavLink to="/login" className="font-medium text-white hover:text-white/80">
            Sign in
          </NavLink>
        </div>
      </form>
    </div>
  );
}
