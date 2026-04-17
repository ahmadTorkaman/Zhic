import { ArticleCard, Grid } from '@zhic/ui';
import type { PayloadArticle } from '@/lib/payload';
import { articlePath } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';

export function JournalGrid({ articles }: { articles: PayloadArticle[] }) {
  if (articles.length === 0) {
    return (
      <p className="py-12 text-center text-body text-stone">
        هنوز مقاله‌ای منتشر نشده است.
      </p>
    );
  }

  return (
    <Grid columns={3} gap="lg">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          href={articlePath(article.slug)}
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
  );
}
