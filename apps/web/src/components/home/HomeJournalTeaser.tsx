import { ArticleCard, Container, Grid, Section, Stack } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';
import type { PayloadArticle } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';

export type HomeJournalTeaserProps = {
  articles: PayloadArticle[];
  heading?: string | null;
};

export function HomeJournalTeaser({ articles, heading }: HomeJournalTeaserProps) {
  if (articles.length === 0) return null;
  return (
    <Section padY="lg">
      <Container>
        <Stack gap="lg">
          <BlockReveal>
            <Stack gap="xs">
              <h2 className="text-h2 font-bold text-charcoal">
                {heading ?? 'از ژورنال'}
              </h2>
              <p className="text-lead text-stone">
                یادداشت‌هایی درباره‌ی چوب، پارچه، و خانه.
              </p>
            </Stack>
          </BlockReveal>
          <Grid columns={3} gap="lg">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                href={`/journal/${article.slug}`}
                title={article.title}
                excerpt={article.excerpt ?? undefined}
                author={article.author?.name ?? undefined}
                publishedAt={article.publishedAt ?? undefined}
                readingTimeMinutes={article.readingTimeMinutes ?? undefined}
                categoryLabel={article.category?.name ?? undefined}
                cover={<PayloadImage media={article.cover ?? null} alt={article.title} fallbackText="بدون تصویر" />}
              />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
