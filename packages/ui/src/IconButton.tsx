import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'default' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  variant?: Variant;
  size?: Size;
  label: string;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'border border-sand bg-transparent hover:border-charcoal',
  subtle: 'bg-transparent hover:bg-cream',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function IconButton({
  variant = 'default',
  size = 'md',
  label,
  children,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'text-charcoal',
        'transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
