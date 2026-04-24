import { SettingsClient } from '@/features/account/settings-client';

export default function AppSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm">Profile and contact details.</p>
      </div>
      <SettingsClient />
    </div>
  );
}
