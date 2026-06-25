import { BlurInText, Button, Container } from '@zhic/ui';
import { StatBlock } from './StatBlock';
import { PayloadImage } from '@/components/PayloadImage';
import { RichText } from '@/lib/richtext';
import type { LexicalRoot, PayloadMedia } from '@/lib/payload';

export type BrandStat = {
  value: number;
  suffix?: string;
  label: string;
};

export type HomeBrandStatementProps = {
  statement?: LexicalRoot | null;
  stats?: BrandStat[];
  heading?: string;
  eyebrow?: string;
  aboutHref?: string;
  aboutMedia?: PayloadMedia | null;
  /** Faint full-bleed texture laid over the forest layer at 20% opacity
      (carved-walnut craft detail by default — swap for any /public asset,
      or pass null to drop it). */
  backgroundTexture?: string | null;
};

const DEFAULT_STATS: BrandStat[] = [
  { value: 25, suffix: '+', label: 'سال تجربه در صنایع چوب' },
  { value: 570430, suffix: '+', label: 'قطعه مبلمان تولیدشده' },
  { value: 22, label: 'شعبه در سراسر ایران' },
];

export function HomeBrandStatement({
  statement,
  stats = DEFAULT_STATS,
  heading = 'از کارخونه،تا خونه',
  eyebrow = 'درباره‌ی ژیک',
  aboutHref = '/about',
  aboutMedia = null,
  backgroundTexture = '/hero-details/celine.webp',
}: HomeBrandStatementProps) {
  return (
    /* NO overflow-hidden here — it would clip the pulled-up stats card.
       The decorative glow is clipped by its own inset-0 wrapper instead. */
    /* No bottom padding either — the CTA positioner line must sit exactly
       on the section's bottom edge; the about grid carries the spacing. */
    <section className="relative isolate bg-forest-dark text-ivory">
      {/* Faint craft texture over the forest layer. -z-10 (the section is an
          `isolate` stacking context) keeps it above the green fill but behind
          all content; 20% opacity so it reads as grain, not a photo. */}
      {backgroundTexture ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- static decorative texture, no LCP concern */}
          <img src={backgroundTexture} alt="" className="h-full w-full object-cover opacity-20" />
        </div>
      ) : null}
      {/* Caramel radial glow in bottom-start corner (RTL: start = right visually) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -bottom-[120px] -start-[120px] h-[500px] w-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(196,154,108,0.06) 0%, transparent 70%)' }}
        />
      </div>
      <Container>
        {/* Floating glass stats card — centered on the ivory/dark boundary
            (half on each side). text-charcoal resets the section's
            text-ivory for the light surface. */}
        <div className="section-overlap-center">
          <div className="float-card stat-row w-full text-charcoal">
            {stats.map((s) => (
              <StatBlock key={s.label} variant="divided" value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>

        {/* mt clears the card's lower half (zero-height positioner above)
            plus the visual gap. */}
        <div
          className={
            aboutMedia
              ? 'mt-9 mb-7 grid items-center gap-[var(--space-6)] md:mt-10 md:mb-9 md:grid-cols-[3fr_2fr] md:gap-[var(--space-10)]'
              : 'mt-9 mb-7 md:mt-10 md:mb-9'
          }
        >
          <div>
            <BlurInText as="div" className="mb-5 text-[length:var(--home-t6)] font-bold text-gold">
              {eyebrow}
            </BlurInText>
            <BlurInText as="h2" className="mb-5 text-[length:var(--home-t2)] font-black leading-[var(--leading-h2)] text-ivory">
              {heading}
            </BlurInText>
            <div className="mb-6">
              {statement ? (
                <div className="font-light [&_p]:mb-2 [&_p]:text-[0.78rem] [&_p]:leading-[1.5] [&_p]:text-white">
                  <RichText value={statement} />
                </div>
              ) : (
                /* Kaveh about story (node 19:131), 3 staggered paragraphs.
                   Operator-supplied copy with intentional kashida (tatweel ـ)
                   elongations preserved verbatim per their request. The CMS
                   `statement` should be updated to match for parity. */
                <div className="space-y-2 text-[0.78rem] font-light leading-[1.5] text-white">
                  <BlurInText as="p">
                    شرکت هنر چوب ژیک، تولیدی سرویس خواب و وسایــــــل اتاق خواب است. ما هر تخت، پاتختی، میز آرایش و کمد را از چـــــــــــوب و ام‌دی‌اف باکیفیت با روکش وکیوم می‌سازیم و بدون واســــــــــــــطه، مستقیم از کارخانه به دست شما می‌رسانیم.
                  </BlurInText>
                  <BlurInText as="p">
                    باور ما این است که اتاق خواب آرام ‌تریـــــــــن گوشه‌ی خانه است؛ برای همین از طراحی تا تـــــــــحویل، به جزئیات وفاداریم؛ تا خوابی خوب و خانه‌ای زیبا داشته باشـــــید. نه بیشتر از آنچه لازم است می‌سازیم، نه کمتر از آنچه شایسته است.
                  </BlurInText>
                  <BlurInText as="p">
                    سرویس خواب ژیک همواره با گارانتی و ارسال به سراسر ایـــــــــــــــران عرضــــــــه مــــی‌شود.
                  </BlurInText>
                </div>
              )}
            </div>
          </div>
          {aboutMedia ? (
            /* Mobile: image above the text (order-first). Desktop: second
               grid column — in RTL that places it inline-end of the text. */
            <div className="overflow-hidden rounded-md max-md:order-first">
              <PayloadImage
                media={aboutMedia}
                className="aspect-[4/3] h-auto w-full object-cover md:aspect-auto md:h-full md:min-h-[320px]"
              />
            </div>
          ) : null}
        </div>

        {/* Gold glass CTA — centered on the dark/ivory BOTTOM boundary,
            mirroring the stats card on the top edge. RTL flex-start
            aligns it with the text column's inline-start. */}
        <div className="section-overlap-center">
          <Button as="a" href={aboutHref} variant="glass-gold" size="md" className="text-[1.008rem]">
            بیشتر درباره‌ی ما
          </Button>
        </div>
      </Container>
    </section>
  );
}
