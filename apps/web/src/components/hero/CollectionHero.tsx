import type { ReactNode } from 'react';
import { HeroOverlayText } from './HeroOverlayText';

export type CollectionHeroProps = {
  /** Slot for the cover image. */
  image?: ReactNode;
  /** Eyebrow above the title. Defaults to "مجموعه". */
  eyebrow?: string;
  /** Collection name. */
  title: string;
};

export function CollectionHero({ image, eyebrow = 'مجموعه', title }: CollectionHeroProps) {
  return (
    <section className="relative mb-8 min-h-[35vh] overflow-hidden bg-cream max-md:min-h-0 max-md:aspect-[3/2]">
      {image ? (
        <div className="absolute inset-0">{image}</div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-body text-stone">
          تصویر مجموعه
        </div>
      )}

      {/* Bottom gradient to ivory */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to top, var(--color-ivory) 0%, transparent 40%)' }}
      />

      <HeroOverlayText pb={7}>
        <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
          {eyebrow}
        </div>
        <h1 className="text-balance text-h1 font-black leading-[1.2] text-ink">{title}</h1>
      </HeroOverlayText>
    </section>
  );
}
