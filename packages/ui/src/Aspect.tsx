import type { ReactNode } from 'react';
import { cn } from './cn';

export type AspectRatio = '1/1' | '3/2' | '4/5' | '3/4' | '16/9' | '21/9';

export type AspectProps = {
  ratio?: AspectRatio;
  className?: string;
  children?: ReactNode;
};

const RATIO_CLASS: Record<AspectRatio, string> = {
  '1/1':  'aspect-square',
  '3/2':  'aspect-[3/2]',
  '4/5':  'aspect-[4/5]',
  '3/4':  'aspect-[3/4]',
  '16/9': 'aspect-video',
  '21/9': 'aspect-[21/9]',
};

export function Aspect({ ratio = '4/5', className, children }: AspectProps) {
  return <div className={cn('relative overflow-hidden', RATIO_CLASS[ratio], className)}>{children}</div>;
}
