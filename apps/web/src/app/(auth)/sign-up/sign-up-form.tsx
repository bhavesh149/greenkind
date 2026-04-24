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
import { signUpBodySchema } from '@greenkind/validation';

type Form = z.infer<typeof signUpBodySchema>;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(signUpBodySchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  return (
    <GlassAuthCard>
      <h1 className="text-foreground font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Create your account
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Start with email and password. You can subscribe next.
      </p>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={handleSubmit(async (data) => {
          setFormError(null);
          try {
            const { user } = await apiFetch<{ user: { role: 'ADMIN' | 'SUBSCRIBER' } }>(
              '/auth/register',
              {
                method: 'POST',
                body: JSON.stringify(data),
              },
            );
            const dest = getPostSignInDestination(searchParams.get('next'), user.role);
            router.push(dest);
            router.refresh();
          } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Registration failed');
          }
        })}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={authLabelClass}>
            Name
          </label>
          <input id="name" autoComplete="name" className={authFieldClass} {...register('name')} />
          {formState.errors.name ? (
            <p className="text-destructive text-xs">{formState.errors.name.message}</p>
          ) : null}
        </div>
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
            autoComplete="new-password"
            className={authFieldClass}
            {...register('password')}
          />
          {formState.errors.password ? (
            <p className="text-destructive text-xs">{formState.errors.password.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <button type="submit" className={cn(buttonVariants(), 'w-full')}>
          {formState.isSubmitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link
          className="text-link font-medium hover:text-link-hover hover:underline"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </GlassAuthCard>
  );
}
