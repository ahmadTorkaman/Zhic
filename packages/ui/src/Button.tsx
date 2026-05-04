import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'accent' | 'ghost' | 'on-dark' | 'link';
type Size = 'sm' | 'md' | 'lg';

type OwnProps = {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
  className?: string;
};

type AsButton = { as?: 'button' } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof OwnProps>;
type AsAnchor = { as: 'a' } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof OwnProps>;

export type ButtonProps = OwnProps & (AsButton | AsAnchor);

const BASE = [
  'inline-flex items-center justify-center gap-2',
  'font-sans font-bold text-small',
  'rounded-md',
  'transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
  'focus-visible:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ');

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-charcoal text-ivory hover:bg-ink hover:-translate-y-px hover:shadow-subtle',
  accent:    'bg-forest text-ivory hover:-translate-y-px hover:shadow-elevated',
  ghost:     'bg-transparent border border-sand text-charcoal hover:border-charcoal',
  'on-dark': 'bg-transparent border border-ivory/15 text-ivory hover:border-gold hover:text-gold focus-ring-invert',
  link:      'bg-transparent text-charcoal border-b border-sand pb-[2px] hover:border-charcoal rounded-none',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-eyebrow',
  md: 'px-[1.75rem] py-[0.9375rem]',
  lg: 'px-[2.25rem] py-4',
};

export function Button(props: ButtonProps) {
  const { as = 'button', variant = 'primary', size = 'md', className, children, ...rest } = props;

  const classes = cn(
    BASE,
    VARIANT_CLASSES[variant],
    variant === 'link' ? '' : SIZE_CLASSES[size],
    className,
  );

  if (as === 'a') {
    const anchorRest = rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof OwnProps>;
    return (
      <a {...anchorRest} className={classes}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof OwnProps>;
  return (
    <button type="button" {...buttonRest} className={classes}>
      {children}
    </button>
  );
}
