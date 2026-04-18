import type { PayloadMedia } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { WordReveal } from '@/components/motion/WordReveal';

export type HomeHeroProps = {
  heading?: string | null;
  subheading?: string | null;
  media?: PayloadMedia | null;
};

const DEFAULT_HEADING = 'ساخته‌شده برای ماندن';
const DEFAULT_SUB =
  'مبلمان دست‌ساز از چوب گردوی ایرانی، برای خانه‌هایی که آرامش را می‌فهمند.';
const SEASON_EYEBROW = 'کلکسیون بهار ۱۴۰۵';

export function HomeHero({ heading, subheading, media }: HomeHeroProps) {
  const src = mediaUrl(media);
  const alt = media?.alt ?? '';
  return (
    <section className="grid min-h-screen grid-cols-1 overflow-hidden md:grid-cols-2">
      {/* Text half — sits on the RTL-start (right) side at md+. Mockup has
          padding-right=4rem (outer/screen edge) and padding-left=2rem (inner/
          divider edge) — under RTL that maps to ps-8 (start = right) and pe-6
          (end = left). */}
      <div className="flex flex-col justify-center bg-ivory px-4 py-9 md:py-11 md:ps-8 md:pe-6">
        <BlockReveal>
          <p className="mb-5 text-eyebrow font-bold uppercase tracking-[0.12em] text-forest">
            {SEASON_EYEBROW}
          </p>
        </BlockReveal>
        <WordReveal
          as="h1"
          className="mb-5 text-balance text-h1 font-black leading-[1.1] text-ink"
        >
          {heading ?? DEFAULT_HEADING}
        </WordReveal>
        <BlockReveal delay={0.3}>
          <p className="mb-7 max-w-[420px] text-lead font-light leading-[var(--leading-lead)] text-stone">
            {subheading ?? DEFAULT_SUB}
          </p>
        </BlockReveal>
        <BlockReveal delay={0.5}>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <a
              href="/products"
              className="inline-flex items-center justify-center rounded-md bg-charcoal px-9 py-4 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:bg-ink hover:shadow-subtle"
            >
              مشاهده‌ی محصولات
            </a>
            <a
              href="/contact?reason=quote"
              className="inline-flex items-center justify-center rounded-md bg-forest px-9 py-4 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:shadow-elevated"
            >
              ثبت استعلام
            </a>
          </div>
        </BlockReveal>
        <div className="mt-auto hidden items-center gap-3 pt-8 text-eyebrow font-light text-stone md:flex">
          <span aria-hidden className="block h-px w-10 bg-sand" />
          اسکرول کنید
        </div>
      </div>

      {/* Image half — RTL-end (left), watermark or media override */}
      <div className="relative order-first min-h-[40vh] overflow-hidden bg-gradient-to-br from-cream to-sand md:order-none md:min-h-0">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[50vw] font-black leading-none text-sand opacity-35 md:text-[24vw]"
          >
            ژ
          </span>
        )}
      </div>
    </section>
  );
}
