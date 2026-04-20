import type { ReactNode } from 'react';
import { DateDisplay } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import { HeroOverlayText } from './HeroOverlayText';

export type ArticleHeroProps = {
  /** Slot for the cover image. Typically <PayloadImage loading=eager fetchPriority=high>. */
  image?: ReactNode;
  /** Category label for the forest eyebrow. */
  category?: string;
  /** Main article title. */
  title: string;
  /** Author info (avatar image + name). Avatar slot is a ReactNode — pass PayloadImage or a letter fallback. */
  authorName?: string;
  authorAvatar?: ReactNode;
  /** ISO 8601 date string or Date. Formatted as Jalali. */
  publishedAt?: string | Date;
  /** Reading time in minutes; renders as "N دقیقه مطالعه" with Persian digits. */
  readingTimeMinutes?: number;
};

export function ArticleHero({
  image, category, title,
  authorName, authorAvatar,
  publishedAt, readingTimeMinutes,
}: ArticleHeroProps) {
  return (
    <section className="relative mb-8 min-h-[50vh] overflow-hidden bg-cream max-md:min-h-0 max-md:aspect-[3/2]">
      {/* Cover image fills the whole box */}
      {image ? (
        <div className="absolute inset-0">{image}</div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-body text-stone">
          تصویر تمام‌عرض
        </div>
      )}

      {/* Bottom-fade gradient to ivory — 50% of height, transparent at top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to top, var(--color-ivory) 0%, transparent 50%)' }}
      />

      {/* Overlay text at bottom */}
      <HeroOverlayText pb={8}>
        {category ? (
          <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
            {category}
          </div>
        ) : null}
        <h1 className="mb-5 text-balance text-h1 font-black leading-[1.2] text-ink">{title}</h1>
        {authorName || publishedAt || typeof readingTimeMinutes === 'number' ? (
          <div className="flex flex-wrap items-center gap-3 text-small text-stone">
            {authorName ? (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sand text-small font-bold text-charcoal">
                  {authorAvatar ?? authorName.slice(0, 1)}
                </div>
                <span className="text-charcoal">{authorName}</span>
              </div>
            ) : null}
            {publishedAt ? (
              <>
                <span aria-hidden>·</span>
                <DateDisplay value={publishedAt} />
              </>
            ) : null}
            {typeof readingTimeMinutes === 'number' ? (
              <>
                <span aria-hidden>·</span>
                <span>{toPersianDigits(readingTimeMinutes)} دقیقه مطالعه</span>
              </>
            ) : null}
          </div>
        ) : null}
      </HeroOverlayText>
    </section>
  );
}
