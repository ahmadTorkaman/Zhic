import { cn } from './cn';

export type ControlSize = 'sm' | 'md' | 'lg';

export const CONTROL_BASE =
  'block w-full bg-ivory text-charcoal font-sans ' +
  'border border-sand rounded-md ' +
  'placeholder:text-stone ' +
  'transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory focus-visible:border-charcoal ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'aria-invalid:border-rust aria-invalid:focus-visible:ring-rust aria-invalid:focus-visible:border-rust';

export const CONTROL_SIZE: Record<ControlSize, string> = {
  sm: 'text-small ps-3 pe-3 py-2',
  md: 'text-body ps-4 pe-4 py-3',
  lg: 'text-lead ps-5 pe-5 py-4',
};

export function controlClassName(size: ControlSize, extra?: string, className?: string) {
  return cn(CONTROL_BASE, CONTROL_SIZE[size], extra, className);
}
