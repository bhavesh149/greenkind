'use client';

import { motion } from 'framer-motion';

export function PricingHero() {
  return (
    <motion.div
      className="max-w-2xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="text-muted-foreground mt-3 text-base leading-relaxed">
        Plans and amounts below are loaded from your Stripe prices when the API is configured;
        otherwise you&apos;ll see sensible development defaults. Create an account, then complete
        Checkout from <strong className="text-foreground/90">Billing</strong> in the app — cancel or
        update anytime in the Stripe customer portal.
      </p>
    </motion.div>
  );
}
