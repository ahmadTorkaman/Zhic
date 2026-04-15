import type { ReactNode } from 'react';
import { cn } from './cn';

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  label?: string;
  separator?: ReactNode;
  className?: string;
};

function ChevronSeparator() {
  return (
    <svg
      viewBox="0 0 8 14"
      width="8"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="mx-2 inline-block text-stone rtl:-scale-x-100"
    >
      <path
        d="M1 1 L7 7 L1 13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Breadcrumbs({
  items,
  label = 'مسیر',
  separator,
  className,
}: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={cn('text-small text-stone', className)}>
      <ol className="inline-flex flex-wrap items-center">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="inline-flex items-center">
              {idx > 0 ? separator ?? <ChevronSeparator /> : null}
              {isLast ? (
                <span aria-current="page" className="text-charcoal">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="rounded-sm hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                >
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
