import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';
type BadgeShape = 'square' | 'rounded';

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-sand text-charcoal',
  accent: 'bg-accent text-ink',
  success: 'bg-forest text-ivory',
  warning: 'bg-gold text-ink',
  error: 'bg-rust text-ivory',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'text-eyebrow px-2 py-1',
  md: 'text-small px-3 py-1',
};

const SHAPE_CLASSES: Record<BadgeShape, string> = {
  square: 'rounded-sm',
  rounded: 'rounded-pill',
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  shape = 'rounded',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1 font-sans tracking-normal leading-none whitespace-nowrap',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        SHAPE_CLASSES[shape],
        className,
      )}
    >
      {children}
    </span>
  );
}
