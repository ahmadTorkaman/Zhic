import { DateDisplay } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { PayloadArticle } from '@/lib/payload';
import { mediaUrl, journalCategoryPath } from '@/lib/payload';

export function ArticleHero({ article }: { article: PayloadArticle }) {
  const coverSrc = mediaUrl(article.cover ?? null);
  const authorAvatarSrc = mediaUrl(article.author?.avatar ?? null);

  return (
    <div className="relative mb-8">
      {/* Cover image: full-bleed, min 50vh on desktop, 3:2 aspect on mobile */}
      <div className="relative min-h-[50vh] overflow-hidden bg-cream max-md:aspect-[3/2] max-md:min-h-0">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={article.cover?.alt ?? article.title}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-body text-stone">
            تصویر کاور این مقاله به‌زودی منتشر می‌شود
          </div>
        )}
        {/* Bottom gradient fade to ivory */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, var(--color-ivory) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Hero text overlaid at the bottom of the cover */}
      <div className="absolute inset-x-0 bottom-0 pb-8 md:pb-9">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-6">
          <div className="max-w-[680px]">
            {article.category ? (
              <a
                href={journalCategoryPath(article.category.slug)}
                className="mb-3 inline-block text-eyebrow font-bold uppercase tracking-[0.06em] text-forest hover:underline"
              >
                {article.category.name}
              </a>
            ) : null}

            <h1 className="mb-3 text-h1 font-black text-ink text-balance">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-small text-stone">
              {article.author ? (
                <div className="flex items-center gap-2">
                  {authorAvatarSrc ? (
                    <img
                      src={authorAvatarSrc}
                      alt={article.author.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-eyebrow font-bold text-charcoal">
                      {article.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-charcoal">{article.author.name}</span>
                </div>
              ) : null}
              {article.publishedAt ? (
                <>
                  <span aria-hidden className="text-stone/60">·</span>
                  <DateDisplay value={article.publishedAt} />
                </>
              ) : null}
              {typeof article.readingTimeMinutes === 'number' ? (
                <>
                  <span aria-hidden className="text-stone/60">·</span>
                  <span>{toPersianDigits(article.readingTimeMinutes)} دقیقه</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
