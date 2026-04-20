import type { ReactNode } from 'react';
import { Container } from '@zhic/ui';

export type HeroOverlayTextProps = {
  children: ReactNode;
  /** Bottom padding (matches the surrounding hero). */
  pb?: 7 | 8 | 9;
  /** Constrain content width. Default 680px. */
  maxWidth?: number;
};

const PB_CLASS: Record<NonNullable<HeroOverlayTextProps['pb']>, string> = {
  7: 'pb-7',
  8: 'pb-8',
  9: 'pb-9',
};

export function HeroOverlayText({ children, pb = 7, maxWidth = 680 }: HeroOverlayTextProps) {
  return (
    <div className={`absolute inset-x-0 bottom-0 ${PB_CLASS[pb]}`}>
      <Container>
        <div style={{ maxWidth: `${maxWidth}px` }}>{children}</div>
      </Container>
    </div>
  );
}
