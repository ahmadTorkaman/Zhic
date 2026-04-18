import { Container, Section, Stack } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';
import type { PayloadArticle } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';
import { toPersianDigits } from '@zhic/locale';

export type HomeJournalTeaserProps = {
  articles: PayloadArticle[];
  heading?: string | null;
};

function FeaturedTile({ article }: { article: PayloadArticle }) {
  return (
    <a
      href={`/journal/${article.slug}`}
      className="group block transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:translate-y-[var(--hover-lift-card)]"
    >
      <div className="relative mb-5 aspect-[3/4] overflow-hidden bg-cream">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage media={article.cover ?? null} alt={article.title} fallbackText="بدون تصویر" />
        </div>
      </div>
      {article.category?.name ? (
        <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-forest">
          {article.category.name}
        </div>
      ) : null}
      <h3 className="text-h3 font-bold text-charcoal text-balance">
        {article.title}
      </h3>
      {article.excerpt ? (
        <p className="mt-3 text-small font-light leading-[var(--leading-lead)] text-stone line-clamp-3">
          {article.excerpt}
        </p>
      ) : null}
    </a>
  );
}

function SmallArticleTile({ article }: { article: PayloadArticle }) {
  return (
    <a
      href={`/journal/${article.slug}`}
      className="group grid grid-cols-[100px_1fr] items-start gap-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:translate-y-[var(--hover-lift-card)] md:grid-cols-[160px_1fr] md:gap-5"
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage media={article.cover ?? null} alt={article.title} fallbackText="بدون تصویر" />
        </div>
      </div>
      <div>
        {article.category?.name ? (
          <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-forest">
            {article.category.name}
          </div>
        ) : null}
        <h3 className="text-body font-bold text-charcoal text-balance">
          {article.title}
        </h3>
        {typeof article.readingTimeMinutes === 'number' ? (
          <div className="mt-2 text-small font-light text-stone">
            {toPersianDigits(article.readingTimeMinutes)} دقیقه مطالعه
          </div>
        ) : null}
      </div>
    </a>
  );
}

export function HomeJournalTeaser({ articles, heading }: HomeJournalTeaserProps) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;
  if (!featured) return null;
  const small = rest.slice(0, 2);

  return (
    <Section padY="xl" fullBleed>
      <Container>
        <Stack gap="lg">
          <BlockReveal>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-h2 font-black text-ink">
                {heading ?? 'از ژورنال'}
              </h2>
              <a
                href="/journal"
                className="border-b border-sand pb-[2px] text-small text-charcoal transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:border-charcoal"
              >
                مشاهده‌ی همه
              </a>
            </div>
          </BlockReveal>

          {/* 2-col at md+, featured spans 2 rows. Mobile = stacked. */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <BlockReveal className="md:row-span-2">
              <FeaturedTile article={featured} />
            </BlockReveal>
            {small.map((article, idx) => (
              <BlockReveal key={article.id} delay={(idx + 1) * 0.08}>
                <SmallArticleTile article={article} />
              </BlockReveal>
            ))}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
