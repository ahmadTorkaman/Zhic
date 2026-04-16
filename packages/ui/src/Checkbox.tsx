'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'children'
> & {
  invalid?: boolean;
  children?: ReactNode;
};

export function Checkbox({
  invalid,
  className,
  children,
  ...rest
}: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-3 text-charcoal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input
          type="checkbox"
          {...rest}
          aria-invalid={invalid || rest['aria-invalid'] || undefined}
          className={cn(
            'peer absolute inset-0 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed',
            className,
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none inline-flex h-4 w-4 items-center justify-center rounded-sm border border-charcoal bg-ivory text-ivory',
            'peer-checked:bg-charcoal peer-checked:border-charcoal',
            'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
            'peer-hover:border-stone',
            'peer-focus-visible:border-forest peer-focus-visible:shadow-[0_0_0_var(--focus-ring-width)_var(--focus-ring-color)]',
            'peer-aria-invalid:border-rust',
          )}
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3 w-3"
          >
            <path
              d="M2.5 6.5 L5 9 L9.5 3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      {children ? <span className="text-body">{children}</span> : null}
    </label>
  );
}
