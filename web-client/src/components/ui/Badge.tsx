import type { ReactNode } from 'react';

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

/** Renders a status pill from a { label, className } meta object. */
export function StatusBadge({ meta }: { meta: { label: string; className: string } }) {
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
