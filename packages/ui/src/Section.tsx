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
   * Opt out of the automatic `<Container>` wrap around children.
   *
   * Default (`fullBleed={false}`): `Section` wraps children in a
   * `<Container>`, which applies the storefront max-width and the
   * standard 4/6 gutter. This is the right default for content.
   *
   * Set `fullBleed` when:
   * - The section has **decorative absolutely-positioned siblings**
   *   (e.g. a radial glow span) that must sit outside the content
   *   max-width but inside the section's bg color.
   * - The section is **itself full-bleed** (e.g. a 21:9 hero image
   *   that spans edge to edge) with no Container needed.
   * - You need to **provide your own `<Container>`** so multiple
   *   Containers inside the section don't double-wrap with different
   *   max-widths.
   *
   * Discovered pattern from Phase D: wrap the content in an explicit
   * `<Container>` inside a `fullBleed` Section whenever decorative
   * siblings need the full section width but content should respect
   * the max-width.
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
  lg: 'py-9',
  xl: 'py-10',
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
    <Component
      {...rest}
      className={cn(BG_CLASSES[bg], PAD_Y_CLASSES[padY], className)}
    >
      {fullBleed ? children : <Container>{children}</Container>}
    </Component>
  );
}
