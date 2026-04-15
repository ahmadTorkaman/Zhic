import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type SkipLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'children'
> & {
  children: ReactNode;
};

const BASE =
  'sr-only focus:not-sr-only ' +
  'focus:fixed focus:top-3 focus:start-3 focus:z-[1100] ' +
  'focus:inline-flex focus:items-center focus:rounded-md ' +
  'focus:bg-charcoal focus:text-ivory focus:text-small ' +
  'focus:px-4 focus:py-2 focus:shadow-modal ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal';

export function SkipLink({ className, children, ...rest }: SkipLinkProps) {
  return (
    <a {...rest} className={cn(BASE, className)}>
      {children}
    </a>
  );
}
