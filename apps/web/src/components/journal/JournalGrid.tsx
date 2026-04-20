import { Tile } from '@/components/tile/Tile';
import { PayloadImage } from '@/components/PayloadImage';
import { articlePath } from '@/lib/payload';
import type { PayloadArticle } from '@/lib/payload';

export type JournalGridProps = {
  articles: PayloadArticle[];
};

export function JournalGrid({ articles }: JournalGridProps) {
  if (!articles.length) {
    return (
      <p className="py-9 text-center text-stone">مقاله‌ای پیدا نشد.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[var(--space-5)] sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => {
        const meta = article.readingTimeMinutes
          ? `${article.readingTimeMinutes} دقیقه مطالعه`
          : undefined;

        return (
          <Tile
            key={article.id}
            href={articlePath(article.slug)}
            image={
              <PayloadImage
                media={article.cover ?? null}
                alt={article.title}
                fallbackText="تصویر"
              />
            }
            aspect="3/2"
            eyebrow={article.category?.name}
            title={article.title}
            titleSize="body"
            meta={meta}
            hover="soft"
          />
        );
      })}
    </div>
  );
}
