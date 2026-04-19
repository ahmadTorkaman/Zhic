import type { TextareaHTMLAttributes } from 'react';
import { cn } from './cn';
import { INPUT_BASE_DARK, INPUT_BASE_LIGHT, type InputTone } from './Input';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  tone?: InputTone;
};

export function Textarea({ tone = 'light', className, ...rest }: TextareaProps) {
  const base = tone === 'dark' ? INPUT_BASE_DARK : INPUT_BASE_LIGHT;
  return <textarea {...rest} className={cn(base, 'resize-none', className)} />;
}
