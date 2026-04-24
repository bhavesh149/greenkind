import { Suspense } from 'react';

import { SignInForm } from './sign-in-form';

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
      <SignInForm />
    </Suspense>
  );
}
