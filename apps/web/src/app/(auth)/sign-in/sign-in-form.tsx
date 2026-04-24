'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { GlassAuthCard } from '@/components/shell/glass-auth-card';
import { buttonVariants } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { getPostSignInDestination } from '@/lib/post-auth-redirect';
import { authFieldClass, authLabelClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { signInBodySchema } from '@greenkind/validation';

type Form = z.infer<typeof signInBodySchema>;

export function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(signInBodySchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <GlassAuthCard>
      <h1 className="text-foreground font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Sign in
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Use the seeded subscriber or your account.
      </p>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={handleSubmit(async (data) => {
          setFormError(null);
          try {
            const { user } = await apiFetch<{ user: { role: 'ADMIN' | 'SUBSCRIBER' } }>(
              '/auth/login',
              {
                method: 'POST',
                body: JSON.stringify(data),
              },
            );
            const dest = getPostSignInDestination(sp.get('next'), user.role);
            router.push(dest);
            router.refresh();
          } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Sign in failed');
          }
        })}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={authFieldClass}
            {...register('email')}
          />
          {formState.errors.email ? (
            <p className="text-destructive text-xs">{formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={authFieldClass}
            {...register('password')}
          />
          {formState.errors.password ? (
            <p className="text-destructive text-xs">{formState.errors.password.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <button type="submit" className={cn(buttonVariants(), 'w-full')}>
          {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        No account?{' '}
        <Link
          className="text-link font-medium hover:text-link-hover hover:underline"
          href="/sign-up"
        >
          Create one
        </Link>
      </p>
    </GlassAuthCard>
  );
}
