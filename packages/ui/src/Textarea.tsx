'use client';

import type { TextareaHTMLAttributes } from 'react';
import { controlClassName, type ControlSize } from './controlClasses';

type Rows = 3 | 5 | 8;

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'rows'
> & {
  size?: ControlSize;
  invalid?: boolean;
  rows?: Rows;
};

export function Textarea({
  size = 'md',
  invalid,
  className,
  rows = 5,
  dir = 'auto',
  ...rest
}: TextareaProps) {
  return (
    <textarea
      dir={dir}
      rows={rows}
      {...rest}
      aria-invalid={invalid || rest['aria-invalid'] || undefined}
      className={controlClassName(size, 'resize-y leading-body', className)}
    />
  );
}
