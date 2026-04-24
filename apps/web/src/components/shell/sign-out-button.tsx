'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { useAuthSession } from '@/components/providers/auth-session-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children?: React.ReactNode;
  /** Visual style of the trigger control (default ghost). */
  triggerVariant?: 'ghost' | 'outline';
};

/**
 * Clears httpOnly `gk_access` + `gk_refresh` via `POST /auth/logout` (see API), then client session state.
 * Shows a confirmation dialog before signing out.
 */
export function SignOutButton({
  className,
  children = 'Sign out',
  triggerVariant = 'ghost',
}: Props) {
  const router = useRouter();
  const { clearSession } = useAuthSession();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const descId = useId();

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const open = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const doLogout = useCallback(async () => {
    setPending(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      setPending(false);
      clearSession();
      close();
      router.push('/');
      router.refresh();
    }
  }, [clearSession, close, router]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    const onPointerDown = (e: Event) => {
      if (e.target === d) {
        close();
      }
    };
    d.addEventListener('click', onPointerDown);
    return () => d.removeEventListener('click', onPointerDown);
  }, [close]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          buttonVariants({ variant: triggerVariant, size: 'sm' }),
          triggerVariant === 'ghost' && 'text-xs',
          className,
        )}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="gk-logout-dialog border-border/60 bg-card text-foreground z-[100] w-[min(100%,24rem)] max-w-lg rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={() => setPending(false)}
      >
        <div className="p-5 sm:p-6">
          <h2 id={titleId} className="font-heading text-lg font-semibold">
            Sign out?
          </h2>
          <p id={descId} className="text-muted-foreground mt-1 text-sm leading-relaxed">
            You&apos;ll return to the public site. Sign in again any time to access your account,
            billing, and scores.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Stay signed in
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => void doLogout()}
              disabled={pending}
            >
              {pending ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
