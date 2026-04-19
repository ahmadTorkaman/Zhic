import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children?: ReactNode;
};

export function Container({ as, children, className, ...rest }: ContainerProps) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...rest}
      className={cn(
        'mx-auto w-full max-w-[var(--container-storefront)] px-4 lg:px-6',
        className,
      )}
    >
      {children}
    </Component>
  );
}
