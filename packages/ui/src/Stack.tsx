import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type StackDirection = 'row' | 'col';
export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export type StackProps = HTMLAttributes<HTMLElement> & {
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  as?: ElementType;
  children?: ReactNode;
};

const DIRECTION_CLASSES: Record<StackDirection, string> = {
  row: 'flex-row',
  col: 'flex-col',
};

const GAP_CLASSES: Record<StackGap, string> = {
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-5',
  lg: 'gap-6',
  xl: 'gap-7',
};

const ALIGN_CLASSES: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const JUSTIFY_CLASSES: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export function Stack({
  direction = 'col',
  gap = 'md',
  align,
  justify,
  as,
  children,
  className,
  ...rest
}: StackProps) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...rest}
      className={cn(
        'flex',
        DIRECTION_CLASSES[direction],
        GAP_CLASSES[gap],
        align ? ALIGN_CLASSES[align] : null,
        justify ? JUSTIFY_CLASSES[justify] : null,
        className,
      )}
    >
      {children}
    </Component>
  );
}
