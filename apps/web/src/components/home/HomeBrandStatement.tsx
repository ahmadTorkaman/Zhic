import { Button, Container } from '@zhic/ui';
import { StatBlock } from './StatBlock';
import { RichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';

export type BrandStat = { value: string; label: string };

export type HomeBrandStatementProps = {
  statement?: LexicalRoot | null;
  stats?: BrandStat[];
  heading?: string;
  eyebrow?: string;
  aboutHref?: string;
};

const DEFAULT_STATS: BrandStat[] = [
  { value: '۲۵+', label: 'سال تجربه در صنایع چوب' },
  { value: '۱۲۰۰+', label: 'قطعه مبلمان تولیدشده' },
  { value: '۳', label: 'شوروم در سراسر ایران' },
];

export function HomeBrandStatement({
  statement,
  stats = DEFAULT_STATS,
  heading = 'از همدان، برای ایران',
  eyebrow = 'درباره‌ی ژیک',
  aboutHref = '/about',
}: HomeBrandStatementProps) {
  return (
    <section className="relative overflow-hidden bg-ink py-[var(--space-11)] text-ivory">
      {/* Caramel radial glow in bottom-start corner (RTL: start = right visually) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[120px] -start-[120px] h-[500px] w-[500px]"
        style={{ background: 'radial-gradient(circle, rgba(196,154,108,0.06) 0%, transparent 70%)' }}
      />
      <Container>
        <div className="grid items-center gap-[var(--space-10)] md:grid-cols-[2fr_3fr]">
          <div className="flex flex-col gap-[var(--space-7)]">
            {stats.map((s, i) => (
              <StatBlock key={i} value={s.value} label={s.label} />
            ))}
          </div>
          <div>
            <div className="mb-5 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-gold">
              {eyebrow}
            </div>
            <h2 className="mb-5 text-h2 font-black leading-[var(--leading-h2)] text-ivory">
              {heading}
            </h2>
            <div className="mb-6">
              {statement ? (
                <div className="text-body font-light leading-[1.85] text-sand">
                  <RichText value={statement} />
                </div>
              ) : (
                <p className="text-body font-light leading-[1.85] text-sand">
                  ژیک در کارگاهی در همدان متولد شد — جایی که سنت کار با چوب ریشه در قرن‌ها دارد. ما چوب گردو را از جنگل‌های شمال تهیه می‌کنیم و با روش‌هایی می‌سازیم که عجله‌ای در آن‌ها نیست. هر قطعه یک سرمایه‌گذاری در آرامش است.
                </p>
              )}
            </div>
            <Button as="a" href={aboutHref} variant="on-dark" size="md">
              بیش‌تر درباره‌ی ما
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
