import { ArticleCard, Container, Grid, Section, Stack } from '@zhic/ui';
import type { PayloadArticle } from '@/lib/payload';
import { articlePath, mediaUrl } from '@/lib/payload';

function ArticleCover({ article }: { article: PayloadArticle }) {
  const src = mediaUrl(article.cover ?? null);
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        بدون تصویر
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={article.cover?.alt ?? article.title}
      className="h-full w-full object-cover"
    />
  );
}

export function RelatedArticles({
  articles,
  heading = 'ادامه مطالعه',
}: {
  articles: PayloadArticle[];
  heading?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <Section padY="md">
      <Container>
        <Stack gap="md">
          <h2 className="text-h3 font-bold text-charcoal">{heading}</h2>
          <Grid columns={3} gap="lg">
            {articles.slice(0, 3).map((article) => (
              <ArticleCard
                key={article.id}
                href={articlePath(article.slug)}
                title={article.title}
                excerpt={article.excerpt ?? undefined}
                author={article.author?.name ?? undefined}
                publishedAt={article.publishedAt ?? undefined}
                readingTimeMinutes={article.readingTimeMinutes ?? undefined}
                categoryLabel={article.category?.name ?? undefined}
                cover={<ArticleCover article={article} />}
              />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
