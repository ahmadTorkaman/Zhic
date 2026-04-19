import type { ReactNode } from 'react';
import { cn } from './cn';

export type FormFieldProps = {
  /** Visible label text. */
  label: string;
  /** htmlFor / id wiring. The input child must use this id. */
  id: string;
  /** Optional helper text below the input. */
  help?: string;
  /** Error message — when present, replaces help and adds aria-describedby wiring. */
  error?: string;
  /** Tone affects label color (sand on dark, charcoal on light). */
  tone?: 'light' | 'dark';
  required?: boolean;
  children: ReactNode;
};

export function FormField({ label, id, help, error, tone = 'light', required, children }: FormFieldProps) {
  const labelClass = tone === 'dark'
    ? 'mb-2 block text-small font-light text-sand'
    : 'mb-2 block text-small font-bold text-charcoal';
  const helpClass = tone === 'dark' ? 'text-small text-sand/80' : 'text-small text-stone';
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="mb-3">
      <label className={labelClass} htmlFor={id}>
        {label}{required ? <span aria-hidden className="ms-1 text-rust">*</span> : null}
      </label>
      {children}
      <div className={cn('mt-1', error ? '' : 'min-h-[1.25rem]')}>
        {error ? (
          <p id={errorId} className="text-small text-rust">{error}</p>
        ) : help ? (
          <p className={helpClass}>{help}</p>
        ) : null}
      </div>
    </div>
  );
}
