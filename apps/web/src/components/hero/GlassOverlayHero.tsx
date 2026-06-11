import type { ReactNode } from 'react';
import { Button } from '@zhic/ui';

export type GlassOverlayHeroProps = {
  /** Slot for the hero photo. Fills the whole section behind the scrim + glass card. */
  image?: ReactNode;
  /** City label (forest eyebrow above h1). */
  city?: string;
  /** Showroom name (h1 in the glass card). */
  title: string;
  /** Headline paragraph. */
  headline?: string;
  /** CTA label + href. Defaults to "رزرو بازدید" + the v2 contact inquiry URL. */
  ctaLabel?: string;
  ctaHref?: string;
};

export function GlassOverlayHero({
  image,
  city,
  title,
  headline,
  ctaLabel = 'رزرو بازدید',
  ctaHref = '/contact?reason=visit',
}: GlassOverlayHeroProps) {
  return (
    <section className="relative mb-9 flex min-h-[55vh] items-center justify-center overflow-hidden bg-cream">
      {/* Background photo */}
      {image ? (
        <div className="absolute inset-0">{image}</div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-body text-stone">
          تصویر شعبه
        </div>
      )}

      {/* Dark scrim */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/30" />

      {/* Glass overlay card (centered) */}
      <div className="relative z-[var(--z-raised)] mx-4 w-full max-w-[520px] rounded-lg p-8 text-center glass-card shadow-card">
        {city ? (
          <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
            {city}
          </div>
        ) : null}
        <h1 className="mb-3 text-balance text-h2 font-black text-ink">{title}</h1>
        {headline ? (
          <p className="mb-5 text-body font-light text-stone">{headline}</p>
        ) : null}
        <Button as="a" href={ctaHref} variant="accent" size="md">{ctaLabel}</Button>
      </div>
    </section>
  );
}
