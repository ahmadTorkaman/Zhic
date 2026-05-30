import { PayloadImage } from '@/components/PayloadImage';
import { articlePath } from '@/lib/payload';
import type { PayloadArticle } from '@/lib/payload';

export type JournalFeaturedArticleProps = {
  article: PayloadArticle;
};

export function JournalFeaturedArticle({ article }: JournalFeaturedArticleProps) {
  const category = article.category;
  const readingTime = article.readingTimeMinutes
    ? `${article.readingTimeMinutes} دقیقه مطالعه`
    : null;

  return (
    <a
      href={articlePath(article.slug)}
      className="group mb-8 grid grid-cols-1 items-center gap-5 md:grid-cols-2"
    >
      {/* Image — mobile: order-2 (stacks below text). Desktop: order-2 → column 2,
           which in RTL is the visually-left column. Matches mockup Option B. */}
      <div className="order-2 overflow-hidden bg-cream transition-shadow duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] group-hover:shadow-[var(--shadow-card)] aspect-[16/9] md:aspect-[4/5]">
        <div className="h-full w-full transition-transform duration-[var(--dur-glacial)] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage
            media={article.cover ?? null}
            alt={article.title}
            fallbackText="تصویر مقاله"
          />
        </div>
      </div>

      {/* Text — mobile: order-1 (stacks above image). Desktop: order-1 → column 1,
           which in RTL is the visually-right column. */}
      <div className="order-1">
        {category ? (
          <div className="mb-[6px] text-eyebrow font-bold tracking-[0.06em] text-forest">
            {category.name}
          </div>
        ) : null}
        <h3 className="mb-[6px] text-h3 font-bold leading-[1.4] text-charcoal">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="mt-3 text-small font-light leading-[1.7] text-stone">
            {article.excerpt}
          </p>
        ) : null}
        {readingTime ? (
          <div className="mt-2 text-small font-light text-stone">{readingTime}</div>
        ) : null}
      </div>
    </a>
  );
}
