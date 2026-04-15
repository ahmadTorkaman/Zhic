'use client';

import type { SelectHTMLAttributes } from 'react';
import { controlClassName, type ControlSize } from './controlClasses';

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> & {
  size?: ControlSize;
  invalid?: boolean;
};

export function Select({
  size = 'md',
  invalid,
  className,
  children,
  dir,
  ...rest
}: SelectProps) {
  return (
    <div className="relative">
      <select
        dir={dir}
        {...rest}
        aria-invalid={invalid || rest['aria-invalid'] || undefined}
        className={controlClassName(
          size,
          'appearance-none pe-9 cursor-pointer',
          className,
        )}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-stone"
      >
        <svg
          viewBox="0 0 12 8"
          width="12"
          height="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M1 1.5 L6 6.5 L11 1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
