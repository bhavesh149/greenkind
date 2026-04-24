/** Text fields using global `input` / `border` / `ring` tokens (Impact palette in dark) */
export const gkFieldClass =
  'h-11 w-full rounded-lg border border-border bg-input px-3.5 text-sm text-foreground shadow-inner outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring/80 focus:ring-2 focus:ring-ring/25';

export const gkLabelClass = 'text-sm font-medium text-foreground/90';

/** @deprecated use gkFieldClass */
export const authFieldClass = gkFieldClass;
/** @deprecated use gkLabelClass */
export const authLabelClass = gkLabelClass;
