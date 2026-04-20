import type { ReactNode } from 'react';

export type CinematicHeroProps = {
  /** Slot for the cover image. Typically `<PayloadImage media=... loading="eager" fetchPriority="high" />`.
   *  When null/undefined, a cream placeholder renders. */
  image?: ReactNode;
};

export function CinematicHero({ image }: CinematicHeroProps) {
  return (
    <div className="relative mb-7 aspect-[4/5] overflow-hidden bg-cream md:aspect-[21/9]">
      {image ?? (
        <div className="flex h-full w-full items-center justify-center text-body text-stone">
          تصویر سینمایی محصول
        </div>
      )}
      {/* Bottom gradient fade to ivory */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
        style={{ background: 'linear-gradient(to top, var(--color-ivory) 0%, transparent 100%)' }}
      />
    </div>
  );
}
