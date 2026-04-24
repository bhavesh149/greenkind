import { Suspense } from 'react';

import { SignUpForm } from './sign-up-form';

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
      <SignUpForm />
    </Suspense>
  );
}
