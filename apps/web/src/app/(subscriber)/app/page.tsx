import { SubscriberHomeDashboard } from '@/features/subscriber/home-dashboard';

export default function AppHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-base max-w-2xl">
          Your subscription, the latest draw, and shortcuts to scores, charity, and settings.
        </p>
      </div>
      <SubscriberHomeDashboard />
    </div>
  );
}
