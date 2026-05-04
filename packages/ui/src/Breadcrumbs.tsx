import type { ReactNode } from 'react';

export type BreadcrumbItem = {
  label: ReactNode;
  /** Omit href for the current/last item (renders as plain text). */
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="مسیر" dir="ltr" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 text-small text-stone">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="inline-flex items-center gap-x-2">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="transition-colors duration-[var(--dur-hover)] hover:text-charcoal"
                >
                  {item.label}
                </a>
              ) : (
                <span className={isLast ? 'text-charcoal' : ''} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <span aria-hidden className="text-stone/60">›</span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
