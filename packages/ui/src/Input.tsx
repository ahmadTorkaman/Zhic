import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export type InputTone = 'light' | 'dark';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  tone?: InputTone;
};

export const INPUT_BASE_LIGHT =
  'w-full rounded-md border border-sand bg-ivory px-4 py-3 text-body text-charcoal placeholder:text-stone/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)] transition-colors duration-[var(--dur-hover)]';

export const INPUT_BASE_DARK =
  'w-full rounded-md border border-ivory/10 bg-transparent px-4 py-[14px] text-body text-ivory placeholder:text-ivory/20 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)] transition-colors duration-[var(--dur-hover)]';

export function Input({ tone = 'light', className, ...rest }: InputProps) {
  const base = tone === 'dark' ? INPUT_BASE_DARK : INPUT_BASE_LIGHT;
  return <input {...rest} className={cn(base, className)} />;
}
