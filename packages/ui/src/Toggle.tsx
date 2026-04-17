'use client';

import { useState, type MouseEvent } from 'react';
import { cn } from './cn';

type Size = 'sm' | 'md';

export type ToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: Size;
  className?: string;
};

const TRACK_SIZE: Record<Size, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const THUMB_SIZE: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

const THUMB_TRANSLATE: Record<Size, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

export function Toggle({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled,
  label,
  size = 'md',
  className,
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleClick = (e: MouseEvent) => {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-pill',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-charcoal' : 'bg-sand',
        TRACK_SIZE[size],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none inline-block rounded-full shadow-sm',
          'transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
          checked ? `${THUMB_TRANSLATE[size]} bg-ivory` : 'translate-x-0.5 bg-stone',
          THUMB_SIZE[size],
        )}
      />
    </button>
  );
}
