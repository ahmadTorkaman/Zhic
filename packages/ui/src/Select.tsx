import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';
import { INPUT_BASE_DARK, INPUT_BASE_LIGHT, type InputTone } from './Input';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  tone?: InputTone;
};

export function Select({ tone = 'light', className, children, ...rest }: SelectProps) {
  const base = tone === 'dark' ? INPUT_BASE_DARK : INPUT_BASE_LIGHT;
  return (
    <select {...rest} className={cn(base, 'cursor-pointer', className)}>
      {children}
    </select>
  );
}
