import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type GridColumns = 1 | 2 | 3 | 4 | 6 | 12;
export type GridGap = 'sm' | 'md' | 'lg' | 'xl';

export type GridProps = HTMLAttributes<HTMLElement> & {
  columns: GridColumns;
  gap?: GridGap;
  as?: ElementType;
  children?: ReactNode;
};

const COLUMN_CLASSES: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12',
};

const GAP_CLASSES: Record<GridGap, string> = {
  sm: 'gap-4',
  md: 'gap-5',
  lg: 'gap-6',
  xl: 'gap-7',
};

export function Grid({
  columns,
  gap = 'md',
  as,
  children,
  className,
  ...rest
}: GridProps) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...rest}
      className={cn('grid', COLUMN_CLASSES[columns], GAP_CLASSES[gap], className)}
    >
      {children}
    </Component>
  );
}
