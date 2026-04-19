import type { ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'status' | 'meta';

export type BadgeProps = {
  variant?: Variant;
  children?: ReactNode;
  className?: string;
};

const BASE = 'inline-flex items-center text-eyebrow font-bold rounded-md px-3 py-1';

const VARIANT_CLASSES: Record<Variant, string> = {
  // Glass-on-image badge ("جدید" on product cards)
  status: 'bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] text-charcoal',
  // Plain meta badge
  meta: 'bg-cream text-charcoal',
};

export function Badge({ variant = 'meta', children, className }: BadgeProps) {
  return <span className={cn(BASE, VARIANT_CLASSES[variant], className)}>{children}</span>;
}
