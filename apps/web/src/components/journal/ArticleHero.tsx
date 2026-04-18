import { Section } from '@zhic/ui';
import { DateDisplay } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { PayloadArticle } from '@/lib/payload';
import { mediaUrl, articlePath, journalCategoryPath } from '@/lib/payload';

export function ArticleHero({ article }: { article: PayloadArticle }) {
  const coverSrc = mediaUrl(article.cover ?? null);
  const authorAvatarSrc = mediaUrl(article.author?.avatar ?? null);

  return (
    <Section padY="lg">
      {coverSrc ? (
        <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-lg bg-cream max-md:aspect-[3/2]">
          <img
            src={coverSrc}
            alt={article.cover?.alt ?? article.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-prose">
        <div className="flex flex-col gap-4">
          {article.category ? (
            <a
              href={journalCategoryPath(article.category.slug)}
              className="text-eyebrow font-bold tracking-wide text-accent hover:underline"
            >
              {article.category.name}
            </a>
          ) : null}

          <h1 className="text-h1 font-bold text-charcoal text-balance">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="text-lead text-stone">{article.excerpt}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 text-small text-stone">
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
                <span className="font-medium text-charcoal">
                  {article.author.name}
                </span>
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
                <span>{toPersianDigits(article.readingTimeMinutes)} دقیقه مطالعه</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
