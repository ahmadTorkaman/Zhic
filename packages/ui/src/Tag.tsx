import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { cn } from './cn';

type TagVariant = 'neutral' | 'accent';
type TagSize = 'sm' | 'md';

export type TagProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  variant?: TagVariant;
  size?: TagSize;
  onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void;
  dismissLabel?: string;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<TagVariant, string> = {
  neutral: 'bg-cream text-charcoal',
  accent: 'bg-cream text-charcoal',
};

const SIZE_CLASSES: Record<TagSize, string> = {
  sm: 'text-eyebrow ps-3 pe-3 py-1',
  md: 'text-small ps-4 pe-4 py-1',
};

const SIZE_WITH_DISMISS: Record<TagSize, string> = {
  sm: 'pe-2',
  md: 'pe-2',
};

export function Tag({
  variant = 'neutral',
  size = 'sm',
  onDismiss,
  dismissLabel = 'حذف',
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1 font-sans tracking-normal leading-none whitespace-nowrap rounded-pill',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        onDismiss ? SIZE_WITH_DISMISS[size] : null,
        className,
      )}
    >
      <span>{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="ms-1 inline-flex h-4 w-4 items-center justify-center rounded-pill text-current hover:bg-charcoal/10 transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 10 10"
            width="8"
            height="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M1 1 L9 9 M9 1 L1 9" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
