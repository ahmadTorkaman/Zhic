import type { ReactNode } from 'react';

export type CinematicHeroProps = {
  /** Slot for the cover image. Typically `<PayloadImage media=... loading="eager" fetchPriority="high" />`.
   *  When null/undefined, a cream placeholder renders. */
  image?: ReactNode;
};

export function CinematicHero({ image }: CinematicHeroProps) {
  return (
    <div className="relative mb-7 aspect-[4/5] overflow-hidden md:aspect-[21/9]">
      {image ?? (
        <div className="flex h-full w-full items-center justify-center text-body text-stone">
          تصویر سینمایی محصول
        </div>
      )}
    </div>
  );
}
