import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

type OwnProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  startSlot?: ReactNode;
  endSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type AsButton = { as?: 'button' } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof OwnProps
>;

type AsAnchor = { as: 'a' } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof OwnProps
>;

export type ButtonProps = OwnProps & (AsButton | AsAnchor);

const BASE = [
  'inline-flex items-center justify-center gap-2',
  'font-sans select-none',
  'rounded-md',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
].join(' ');

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-charcoal text-ivory hover:bg-ink',
  secondary:
    'border border-charcoal bg-transparent text-charcoal hover:bg-charcoal hover:text-ivory',
  ghost: 'bg-transparent text-charcoal hover:bg-sand',
  link: 'bg-transparent text-charcoal underline underline-offset-4 decoration-1 hover:decoration-2 px-0 py-0 rounded-none',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-small px-4 py-2',
  md: 'text-body px-5 py-3',
  lg: 'text-lead px-6 py-4',
};

function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4 animate-spin"
      role="status"
      aria-label="در حال بارگذاری"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Button(props: ButtonProps) {
  const {
    as = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    startSlot,
    endSlot,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    BASE,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
  const startContent = loading ? <Spinner /> : startSlot;
  const content = (
    <>
      {startContent ? (
        <span className="inline-flex shrink-0">{startContent}</span>
      ) : null}
      {children}
      {endSlot ? (
        <span className="inline-flex shrink-0">{endSlot}</span>
      ) : null}
    </>
  );

  if (as === 'a') {
    const anchorRest = rest as Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof OwnProps
    >;
    return (
      <a
        {...anchorRest}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
      >
        {content}
      </a>
    );
  }

  const buttonRest = rest as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof OwnProps
  >;
  return (
    <button
      type="button"
      {...buttonRest}
      className={classes}
      disabled={buttonRest.disabled || loading}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}
