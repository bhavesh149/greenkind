export function GlassAuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card/85 border-border/50 dark:border-border/40 dark:bg-card/75 relative w-full max-w-md rounded-2xl border p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-9 dark:shadow-black/50">
      <div
        className="from-foreground/4 pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b to-transparent dark:from-white/5"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}
