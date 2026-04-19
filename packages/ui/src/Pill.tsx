import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type OwnProps = {
  active?: boolean;
  children?: ReactNode;
  className?: string;
};

type AsButton = { as?: 'button' } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof OwnProps>;
type AsAnchor = { as: 'a' } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof OwnProps>;

export type PillProps = OwnProps & (AsButton | AsAnchor);

const BASE = [
  'inline-flex items-center',
  'rounded-pill px-4 py-1.5',
  'text-eyebrow font-bold',
  'transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
  'whitespace-nowrap',
].join(' ');

export function Pill(props: PillProps) {
  const { as = 'button', active, className, children, ...rest } = props;

  const stateClasses = active
    ? 'bg-charcoal text-ivory'
    : 'bg-cream text-charcoal hover:bg-sand';

  const classes = cn(BASE, stateClasses, className);
  const ariaCurrent = active ? 'true' : undefined;

  if (as === 'a') {
    const anchorRest = rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof OwnProps>;
    return (
      <a {...anchorRest} aria-current={ariaCurrent} className={classes}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof OwnProps>;
  return (
    <button type="button" {...buttonRest} aria-current={ariaCurrent} className={classes}>
      {children}
    </button>
  );
}
