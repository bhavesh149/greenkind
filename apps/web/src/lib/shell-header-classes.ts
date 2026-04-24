/** Shared marketing + app + admin top bar (visual consistency). */
export const SHELL_HEADER_BAR =
  'border-border/40 bg-card/80 supports-[backdrop-filter]:bg-card/55 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] sticky top-0 z-40 w-full border-b backdrop-blur-xl dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)]';

const SHELL_INNER =
  'mx-auto flex h-14 w-full items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6';

/** Subscriber app content width */
export const SHELL_HEADER_INNER_MAX_5 = `${SHELL_INNER} max-w-5xl`;
/** Marketing + admin + auth marketing links width */
export const SHELL_HEADER_INNER_MAX_6 = `${SHELL_INNER} max-w-6xl`;
