import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type ContainerSize = 'storefront' | 'operator';

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  size?: ContainerSize;
  as?: ElementType;
  children?: ReactNode;
};

const SIZE_CLASSES: Record<ContainerSize, string> = {
  storefront: 'max-w-[var(--container-storefront)]',
  operator: 'max-w-[var(--container-operator)]',
};

export function Container({
  size = 'storefront',
  as,
  children,
  className,
  ...rest
}: ContainerProps) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...rest}
      className={cn(
        'mx-auto w-full px-4 lg:px-6',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </Component>
  );
}
