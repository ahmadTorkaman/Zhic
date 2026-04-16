'use client';

import { Children, type ReactNode } from 'react';
import { cn } from '@zhic/ui';

interface PageRevealProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
}

export function PageReveal({ children, stagger = 150, className }: PageRevealProps) {
  return (
    <div className={cn('page-reveal', className)}>
      {Children.map(children, (child, i) => (
        <div style={{ '--reveal-index': i } as React.CSSProperties}>
          {child}
        </div>
      ))}
    </div>
  );
}
