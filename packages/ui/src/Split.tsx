import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type SplitRatio = '50/50' | '60/40' | '40/60';
export type SplitGap = 'sm' | 'md' | 'lg' | 'xl';

export type SplitProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  ratio?: SplitRatio;
  gap?: SplitGap;
  reverse?: boolean;
  as?: ElementType;
  children: [ReactNode, ReactNode];
};

const RATIO_CLASSES: Record<SplitRatio, string> = {
  '50/50': 'md:grid-cols-2',
  '60/40': 'md:grid-cols-[3fr_2fr]',
  '40/60': 'md:grid-cols-[2fr_3fr]',
};

const GAP_CLASSES: Record<SplitGap, string> = {
  sm: 'gap-5',
  md: 'gap-6',
  lg: 'gap-7',
  xl: 'gap-8',
};

export function Split({
  ratio = '50/50',
  gap = 'lg',
  reverse = false,
  as,
  children,
  className,
  ...rest
}: SplitProps) {
  const Component: ElementType = as ?? 'div';
  const [first, second] = children;
  return (
    <Component
      {...rest}
      className={cn(
        'grid grid-cols-1 items-start',
        RATIO_CLASSES[ratio],
        GAP_CLASSES[gap],
        className,
      )}
    >
      <div className={reverse ? 'md:order-2' : undefined}>{first}</div>
      <div className={reverse ? 'md:order-1' : undefined}>{second}</div>
    </Component>
  );
}
