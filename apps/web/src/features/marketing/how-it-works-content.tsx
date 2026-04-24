'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

const steps = [
  {
    n: '01',
    t: 'Subscribe',
    d: 'Pick monthly or annual billing. Your subscription unlocks the score tracker, charity split, and draw eligibility — managed securely with Stripe.',
  },
  {
    n: '02',
    t: 'Log your last five',
    d: 'Enter Stableford scores (1–45) with real round dates. We keep a rolling set of five—fair, simple, and easy to audit.',
  },
  {
    n: '03',
    t: 'Choose impact',
    d: 'Select a partner from the directory and set at least 10% of your fee to go to that charity. You can change it anytime (when subscribed).',
  },
  {
    n: '04',
    t: 'Join the draw',
    d: 'Each month, numbers are generated (random or weighted mode). 3-, 4-, and 5-number tiers split the pool; top-tier can roll if unclaimed — all published in-app.',
  },
] as const;

export function HowItWorksContent() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.h1
        className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        How it works
      </motion.h1>
      <motion.p
        className="text-muted-foreground mt-3 text-base leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      >
        Four steps from signup to draw night — designed for trust and clarity, not for clutter.
      </motion.p>
      <ol className="mt-10 space-y-6">
        {steps.map((s, i) => (
          <motion.li
            key={s.n}
            className="border-border/60 flex gap-4 rounded-xl border bg-card/40 p-4 sm:gap-6 sm:p-5"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="text-brand-600 dark:text-brand-300 font-heading w-10 shrink-0 text-2xl font-semibold tabular-nums sm:w-12">
              {s.n}
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold">{s.t}</h2>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed sm:text-base">
                {s.d}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
      <motion.div
        className="mt-12 flex flex-wrap gap-3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Link href="/pricing" className={buttonVariants()}>
          See pricing
        </Link>
        <Link href="/charities" className={buttonVariants({ variant: 'outline' })}>
          Charities
        </Link>
      </motion.div>
    </div>
  );
}
