'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const stagger = 0.08;

export function MarketingHome() {
  return (
    <main>
      <section className="from-brand-50/60 dark:from-mint/10 relative overflow-hidden border-b border-transparent bg-gradient-to-b to-transparent">
        <div
          className="bg-warm-300/20 pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full blur-3xl dark:bg-warm-500/10"
          aria-hidden
        />
        <div
          className="bg-mint/10 dark:bg-mint/5 pointer-events-none absolute top-1/3 left-0 h-48 w-48 rounded-full blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <motion.p
            className="text-link font-heading mb-3 text-sm font-medium tracking-wide uppercase"
            {...fade}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            Impact + play
          </motion.p>
          <motion.h1
            className="text-foreground font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:max-w-3xl"
            {...fade}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          >
            Your scores fund what matters. Every month, a new chance to win.
          </motion.h1>
          <motion.p
            className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed"
            {...fade}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          >
            GreenKind is a subscription platform: track your last five rounds, back a charity you
            care about, and join monthly draws with clear rules and real transparency.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Link href="/pricing" className={buttonVariants()}>
              View plans
            </Link>
            <Link href="/how-it-works" className={buttonVariants({ variant: 'outline' })}>
              How it works
            </Link>
            <Link
              href="/charities"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'text-brand-700 dark:text-brand-200',
              )}
            >
              Browse charities
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.h2
          className="font-heading text-2xl font-semibold sm:text-3xl"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        >
          Why GreenKind
        </motion.h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-base">
          Built for trust: subscription-first access, rolling score history, and admin-verified
          wins—without looking like a dated golf brochure.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Charity you choose',
              desc: 'Set your recipient and give at least 10% of your subscription. Increase anytime.',
              body: 'Browse a directory, learn who they support, and lead with impact first.',
            },
            {
              title: 'Last five scores',
              desc: 'Stableford 1–45, one date per entry. We keep a rolling record—simple, fair, auditable.',
              body: 'Replace the oldest as you add new rounds.',
            },
            {
              title: 'Monthly draws',
              desc: '3, 4, and 5-number tiers with published rules and a prize pool from subscriber support.',
              body: 'Admin can simulate before publish, with rollover for top-tier jackpots.',
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-24px' }}
              transition={{
                duration: 0.45,
                delay: i * stagger,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              <Card className="border-border/60 h-full shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription>{c.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{c.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
