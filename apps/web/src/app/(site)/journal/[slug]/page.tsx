import { notFound } from 'next/navigation';
import { Container } from '@zhic/ui';
import { ArticleHero } from '@/components/hero/ArticleHero';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { AuthorCard } from '@/components/journal/AuthorCard';
import { ArticleProse } from '@/components/journal/ArticleProse';
import { PayloadImage } from '@/components/PayloadImage';
import { fetchArticle, fetchLatestArticles } from '@/lib/payload';
import { buildMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ slug: string }> };

export default async function ArticlePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const categoryLabel = article.category?.name ?? undefined;

  // Build a single-letter avatar fallback node when author has no avatar image
  const author = article.author;
  const authorAvatarNode = author?.avatar
    ? <PayloadImage media={author.avatar} alt={author.name} />
    : author ? (
        <span className="flex h-full w-full items-center justify-center bg-sand text-h4 font-bold text-charcoal">
          {author.name.trim().slice(0, 1)}
        </span>
      )
    : null;

  // Related articles fetched separately (not depth-3 guaranteed). Fall back to latest.
  const related = article.relatedArticles && article.relatedArticles.length > 0
    ? article.relatedArticles.slice(0, 3)
    : await fetchLatestArticles(3).then((all) => all.filter((a) => a.slug !== article.slug).slice(0, 3));

  return (
    <>
      <ArticleHero
        image={article.cover ? <PayloadImage media={article.cover} alt={article.title} loading="eager" fetchPriority="high" /> : undefined}
        category={categoryLabel}
        title={article.title}
        authorName={author?.name}
        authorAvatar={authorAvatarNode ?? undefined}
        publishedAt={article.publishedAt ?? undefined}
        readingTimeMinutes={article.readingTimeMinutes ?? undefined}
      />

      <section className="py-9">
        <Container>
          {article.excerpt ? (
            <p className="mx-auto mb-8 max-w-[680px] text-lead font-light text-stone">
              {article.excerpt}
            </p>
          ) : null}
          <ArticleProse value={article.body} />
        </Container>
      </section>

      {author ? (
        <section className="border-t border-sand py-9">
          <Container>
            <div className="mx-auto max-w-[680px]">
              <AuthorCard author={author} />
            </div>
          </Container>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="border-t border-sand py-9">
          <Container>
            <h2 className="mb-6 text-h3 font-bold text-ink">مقاله‌های مرتبط</h2>
            <JournalGrid articles={related} />
          </Container>
        </section>
      ) : null}

      <div className="pb-12" />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const article = await fetchArticle(slug);
  return buildMetadata({
    seo: article?.seo,
    title: article?.title ?? 'مقاله',
    description: article?.excerpt,
    path: `/journal/${slug}`,
  });
}
