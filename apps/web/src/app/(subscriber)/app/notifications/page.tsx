import { NotificationsClient } from '@/features/notifications/notifications-client';

export default function AppNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground mt-2 text-sm">Draws, wins, and product updates.</p>
      </div>
      <NotificationsClient />
    </div>
  );
}
