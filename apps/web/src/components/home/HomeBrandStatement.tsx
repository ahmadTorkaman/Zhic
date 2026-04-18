import { Container, Section } from '@zhic/ui';
import type { LexicalRoot } from '@/lib/payload';
import { RichText } from '@/lib/richtext';
import { BlockReveal } from '@/components/motion/BlockReveal';

export type HomeBrandStatementProps = {
  body?: LexicalRoot | null;
};

const FALLBACK_PARAGRAPH =
  'ژیک در کارگاهی در همدان متولد شد — جایی که سنت کار با چوب ریشه در قرن‌ها دارد. ما چوب گردو را از جنگل‌های شمال تهیه می‌کنیم و با روش‌هایی می‌سازیم که عجله‌ای در آن‌ها نیست. هر قطعه یک سرمایه‌گذاری در آرامش است.';

const STATS: ReadonlyArray<{ number: string; label: string }> = [
  { number: '۲۵+', label: 'سال تجربه در صنایع چوب' },
  { number: '۱۲۰۰+', label: 'قطعه مبلمان تولیدشده' },
  { number: '۳', label: 'شوروم در سراسر ایران' },
];

export function HomeBrandStatement({ body }: HomeBrandStatementProps) {
  return (
    <Section bg="ink" padY="xl" fullBleed className="relative overflow-hidden">
      {/* Radial gold glow — decorative, behind content */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[120px] -end-[120px] h-[500px] w-[500px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(196,154,108,0.06) 0%, transparent 70%)',
        }}
      />
      <Container>
        <div className="relative grid grid-cols-1 items-center gap-9 md:grid-cols-[2fr_3fr] md:gap-10">
          {/* Stats column */}
          <BlockReveal>
            <ul className="flex flex-row gap-5 overflow-x-auto pb-4 md:flex-col md:gap-7 md:overflow-visible md:pb-0">
              {STATS.map((stat) => (
                <li
                  key={stat.label}
                  className="min-w-[140px] flex-shrink-0 border-s-2 border-gold ps-5 md:min-w-0"
                >
                  <div className="text-h3 font-black leading-[var(--leading-h2)] text-ivory md:text-h2">
                    {stat.number}
                  </div>
                  <div className="mt-1 text-small font-light text-sand">
                    {stat.label}
                  </div>
                </li>
              ))}
            </ul>
          </BlockReveal>

          {/* Text column */}
          <BlockReveal delay={0.15}>
            <p className="mb-5 text-eyebrow font-bold uppercase tracking-[0.12em] text-gold">
              درباره‌ی ژیک
            </p>
            <h2 className="mb-5 text-h2 font-black leading-[var(--leading-h2)] text-ivory">
              از همدان، برای ایران
            </h2>
            <div className="mb-6 text-body font-light leading-[1.85] text-sand">
              {body ? (
                <RichText value={body} />
              ) : (
                <p>{FALLBACK_PARAGRAPH}</p>
              )}
            </div>
            <a
              href="/about"
              className="inline-flex items-center rounded-md border border-ivory/15 bg-transparent px-9 py-[15px] text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:border-gold hover:text-gold focus-ring-invert"
            >
              بیش‌تر درباره‌ی ما
            </a>
          </BlockReveal>
        </div>
      </Container>
    </Section>
  );
}
