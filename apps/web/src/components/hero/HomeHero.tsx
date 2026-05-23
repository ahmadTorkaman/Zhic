import type { ReactNode } from 'react';
import { Button } from '@zhic/ui';

export type HomeHeroProps = {
  /** Eyebrow text above the headline. Defaults to "کلکسیون بهار ۱۴۰۵". */
  eyebrow?: string;
  /** Main headline. Renders with whitespace-pre-line so `\n` becomes a line break. Default: "ساخته‌شده\nبرای ماندن". */
  heading?: string;
  /** Lead paragraph below the heading. */
  subheading?: string;
  /** Optional hero image that replaces the gradient + watermark on the image half. */
  image?: ReactNode;
};

const DEFAULT_EYEBROW = 'کلکسیون بهار ۱۴۰۵';
const DEFAULT_HEADING = 'ساخته‌شده\nبرای ماندن';
const DEFAULT_SUB =
  'مبلمان دست‌ساز از چوب گردوی ایرانی، برای خانه‌هایی که آرامش را می‌فهمند.';

export function HomeHero({
  eyebrow = DEFAULT_EYEBROW,
  heading = DEFAULT_HEADING,
  subheading = DEFAULT_SUB,
  image,
}: HomeHeroProps) {
  return (
    <section className="grid min-h-screen grid-cols-1 overflow-hidden pt-[var(--header-height)] md:grid-cols-2 md:pt-0">
      {/* Text half — bg-ivory, RTL-start (right) on md+, second child on mobile (below image) */}
      <div className="order-2 flex flex-col justify-center bg-ivory px-4 py-9 md:order-1 md:py-11 md:ps-8 md:pe-6">
        <div className="mb-5 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
          {eyebrow}
        </div>
        <h1 className="mb-5 text-balance whitespace-pre-line text-h1 font-black leading-[1.1] text-ink">
          {heading}
        </h1>
        <p className="mb-7 max-w-[420px] text-lead font-light leading-[var(--leading-lead)] text-stone">
          {subheading}
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
          <Button as="a" href="/bedroom-furniture" variant="primary" size="lg">مشاهده‌ی محصولات</Button>
          <Button as="a" href="/contact?reason=quote" variant="accent" size="lg">ثبت استعلام</Button>
        </div>
        {/* Scroll hint — desktop only */}
        <div className="mt-auto hidden items-center gap-3 pt-8 text-eyebrow font-light text-stone md:flex">
          <span aria-hidden className="block h-px w-10 bg-sand" />
          اسکرول کنید
        </div>
      </div>

      {/* Image half — RTL-end (left) on md+, order-first on mobile (above text) */}
      <div className="relative order-1 min-h-[40vh] overflow-hidden bg-gradient-to-br from-cream to-sand md:order-2 md:min-h-0">
        {image ? (
          image
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[50vw] font-black leading-none text-sand opacity-35 fade-in md:text-[24vw]"
          >
            ژ
          </span>
        )}
      </div>
    </section>
  );
}
