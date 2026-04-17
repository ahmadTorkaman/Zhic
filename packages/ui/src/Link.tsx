import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'inline' | 'standalone';

export type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'children'
> & {
  variant?: Variant;
  external?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  inline:
    'underline underline-offset-4 decoration-sand decoration-1 hover:decoration-charcoal',
  standalone:
    'no-underline hover:opacity-80',
};

export function Link({
  variant = 'inline',
  external,
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <a
      {...rest}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'text-charcoal rounded-sm',
        'transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}
