import { CharitySelectionClient } from './charity-selection-client';

export default function AppCharityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Your charity</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-base">
          Pick an impact partner and set the share of your subscription that goes to them. You can
          change this anytime. One-time donations are available on each charity’s public page.
        </p>
      </div>
      <CharitySelectionClient />
    </div>
  );
}
