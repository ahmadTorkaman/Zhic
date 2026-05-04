import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Container } from './Container';

type Bg = 'ivory' | 'cream' | 'sand' | 'charcoal' | 'ink' | 'transparent';
type PadY = 'sm' | 'md' | 'lg' | 'xl';

export type SectionProps = HTMLAttributes<HTMLElement> & {
  bg?: Bg;
  padY?: PadY;
  as?: ElementType;
  /**
   * Opt out of the auto-Container wrap. Set when:
   * - Section has decorative absolutely-positioned siblings outside content max-width
   * - Section is itself full-bleed (e.g. a 21:9 hero image edge-to-edge)
   * - You provide your own <Container> inside (avoids double-wrap)
   */
  fullBleed?: boolean;
  children?: ReactNode;
};

const BG_CLASSES: Record<Bg, string> = {
  ivory: 'bg-ivory text-charcoal',
  cream: 'bg-cream text-charcoal',
  sand: 'bg-sand text-charcoal',
  charcoal: 'bg-charcoal text-ivory',
  ink: 'bg-ink text-ivory',
  transparent: 'bg-transparent',
};

const PAD_Y_CLASSES: Record<PadY, string> = {
  sm: 'py-7',
  md: 'py-8',
  lg: 'py-9 md:py-11',
  xl: 'py-9 md:py-11',
};

export function Section({
  bg = 'transparent',
  padY = 'lg',
  as,
  fullBleed,
  children,
  className,
  ...rest
}: SectionProps) {
  const Component: ElementType = as ?? 'section';
  return (
    <Component {...rest} className={cn(BG_CLASSES[bg], PAD_Y_CLASSES[padY], className)}>
      {fullBleed ? children : <Container>{children}</Container>}
    </Component>
  );
}
