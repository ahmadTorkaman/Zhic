import type { PayloadArticle } from '@/lib/payload';
import { articlePath } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';
import { toPersianDigits } from '@zhic/locale';

function ArticleTile({ article }: { article: PayloadArticle }) {
  return (
    <a
      href={articlePath(article.slug)}
      className="group block transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:translate-y-[var(--hover-lift-card)]"
    >
      <div className="relative mb-4 aspect-[3/2] overflow-hidden bg-cream">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage media={article.cover ?? null} alt={article.title} fallbackText="بدون تصویر" />
        </div>
      </div>
      {article.category?.name ? (
        <div className="mb-2 text-eyebrow font-bold uppercase tracking-[0.06em] text-forest">
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
    </a>
  );
}

export function JournalGrid({ articles }: { articles: PayloadArticle[] }) {
  if (articles.length === 0) {
    return (
      <p className="py-12 text-center text-body text-stone">
        هنوز مقاله‌ای منتشر نشده است.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
      {articles.map((article) => (
        <ArticleTile key={article.id} article={article} />
      ))}
    </div>
  );
}
