/**
 * ParImpact-style layered dark canvas: charcoal base + soft mint/teal glows.
 * Pure CSS (no heavy assets) so it stays fast and mobile-friendly.
 */
export function AuthCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="gk-auth-root text-foreground relative isolate min-h-dvh overflow-hidden bg-[#0a0c0d]">
      {/* Base wash — matches global mint accent */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--gk-mint)_18%,transparent),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-mint/12 blur-[100px]"
        aria-hidden
      />
      <div
        className="bg-[#1e4d3a]/35 pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full blur-[90px]"
        aria-hidden
      />
      <div
        className="bg-[#1a2e28]/50 pointer-events-none absolute bottom-[-10%] left-1/3 h-[300px] w-[500px] -translate-x-1/2 rounded-full blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,transparent_35%,rgba(0,0,0,0.4)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,black,transparent)]"
        aria-hidden
      />
      {children}
    </div>
  );
}
