'use client';

import type { InputHTMLAttributes } from 'react';
import { controlClassName, type ControlSize } from './controlClasses';

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> & {
  size?: ControlSize;
  invalid?: boolean;
};

export function Input({
  size = 'md',
  invalid,
  className,
  type = 'text',
  dir = 'auto',
  ...rest
}: InputProps) {
  return (
    <input
      type={type}
      dir={dir}
      {...rest}
      aria-invalid={invalid || rest['aria-invalid'] || undefined}
      className={controlClassName(size, undefined, className)}
    />
  );
}
