import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">{description}</p>
        ) : null}
        {children ? (
          <div className="mt-6">{children}</div>
        ) : (
          <p className="text-muted-foreground mt-6 text-sm">
            This page will be implemented in a later phase.
          </p>
        )}
      </div>
    </div>
  );
}
