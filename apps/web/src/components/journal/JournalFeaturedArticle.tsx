import type { PayloadArticle } from '@/lib/payload';
import { articlePath } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';
import { toPersianDigits } from '@zhic/locale';

type Props = {
  article: PayloadArticle;
};

export function JournalFeaturedArticle({ article }: Props) {
  return (
    <a
      href={articlePath(article.slug)}
      className="group mb-8 grid grid-cols-1 items-center gap-5 md:grid-cols-2"
    >
      {/* Image: RTL-end (visually left) at md+ via grid order; mobile stacks above text */}
      <div className="relative order-first overflow-hidden bg-cream md:order-last">
        <div className="aspect-[16/9] md:aspect-[4/5]">
          <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
            <PayloadImage media={article.cover ?? null} alt={article.title} fallbackText="بدون تصویر" />
          </div>
        </div>
      </div>
      <div>
        {article.category?.name ? (
          <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-forest">
            {article.category.name}
          </div>
        ) : null}
        <h2 className="mb-3 text-h3 font-black text-ink text-balance">
          {article.title}
        </h2>
        {article.excerpt ? (
          <p className="mb-4 text-body font-light leading-[1.7] text-stone">
            {article.excerpt}
          </p>
        ) : null}
        <div className="text-small font-light text-stone">
          {article.author?.name ? (
            <>
              {article.author.name}
              {typeof article.readingTimeMinutes === 'number' ? (
                <> · {toPersianDigits(article.readingTimeMinutes)} دقیقه مطالعه</>
              ) : null}
            </>
          ) : typeof article.readingTimeMinutes === 'number' ? (
            <>{toPersianDigits(article.readingTimeMinutes)} دقیقه مطالعه</>
          ) : null}
        </div>
      </div>
    </a>
  );
}
