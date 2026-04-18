import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type AspectRatio = '1/1' | '4/5' | '3/2' | '16/9' | '21/9';

export type AspectProps = HTMLAttributes<HTMLElement> & {
  ratio: AspectRatio;
  as?: ElementType;
  children?: ReactNode;
};

const RATIO_CLASSES: Record<AspectRatio, string> = {
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-video',
  '21/9': 'aspect-[21/9]',
};

export function Aspect({
  ratio,
  as,
  children,
  className,
  ...rest
}: AspectProps) {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...rest}
      className={cn(
        'relative block w-full overflow-hidden',
        RATIO_CLASSES[ratio],
        className,
      )}
    >
      {children}
    </Component>
  );
}
