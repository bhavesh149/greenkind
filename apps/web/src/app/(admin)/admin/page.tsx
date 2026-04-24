import { AdminHomeClient } from './admin-home-client';

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2 text-base">Live stats from the API.</p>
      </div>
      <AdminHomeClient />
    </div>
  );
}
