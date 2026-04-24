import { PricingHero } from '@/features/marketing/pricing-hero';
import { PricingSection } from '@/features/marketing/pricing-section';

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <PricingHero />
      <div className="mt-10">
        <PricingSection />
      </div>
    </div>
  );
}
