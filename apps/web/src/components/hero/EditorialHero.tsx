import type { ReactNode } from 'react';
import { BlurInText } from '@zhic/ui';
import { HeroOverlayText } from './HeroOverlayText';

type Height = 'sm' | 'md' | 'lg' | 'xl';

export type EditorialHeroProps = {
  /** Slot for the cover image. */
  image?: ReactNode;
  /** Forest eyebrow text. E.g. "درباره‌ی ژیک" / "کارگاه ژیک" / "راهنما". */
  eyebrow: string;
  /** Main title. */
  title: string;
  /** Desktop min-height — sm=35vh (care), md=40vh, lg=45vh (about), xl=50vh (atelier). */
  height?: Height;
  /** Text shown inside the cream placeholder when no image is passed. */
  placeholder?: string;
};

const HEIGHT_CLASS: Record<Height, string> = {
  sm: 'min-h-[35vh]',
  md: 'min-h-[40vh]',
  lg: 'min-h-[45vh]',
  xl: 'min-h-[50vh]',
};

export function EditorialHero({
  image, eyebrow, title, height = 'md',
  placeholder = 'تصویر کاور',
}: EditorialHeroProps) {
  return (
    <section className={`relative mb-8 overflow-hidden bg-cream max-md:min-h-0 max-md:aspect-[3/2] ${HEIGHT_CLASS[height]}`}>
      {image ? (
        <div className="absolute inset-0">{image}</div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-body text-stone">
          {placeholder}
        </div>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to top, var(--color-ivory) 0%, transparent 40%)' }}
      />

      <HeroOverlayText pb={7}>
        <BlurInText
          as="div"
          className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest"
        >
          {eyebrow}
        </BlurInText>
        <BlurInText
          as="h1"
          className="text-balance text-h1 font-black leading-[1.2] text-ink"
          delay={120}
        >
          {title}
        </BlurInText>
      </HeroOverlayText>
    </section>
  );
}
