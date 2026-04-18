import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Section, Stack } from '@zhic/ui';
import { Breadcrumbs } from '@zhic/ui';
import {
  fetchArticle,
  fetchProduct,
  mediaUrl,
  type PayloadMaterial,
  type PayloadProduct,
} from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { articlePageJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import {
  ArticleRichText,
  extractEmbeddedIds,
  type EmbedContext,
} from '@/lib/richtext';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { ArticleHero } from '@/components/journal/ArticleHero';
import { AuthorCard } from '@/components/journal/AuthorCard';
import { RelatedProducts } from '@/components/journal/RelatedProducts';
import { RelatedArticles } from '@/components/journal/RelatedArticles';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: 'مقاله یافت نشد' };
  return {
    title: `${article.title} — ژورنال`,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt ?? undefined,
    },
  };
}

async function fetchEmbeds(
  productIds: (string | number)[],
  materialIds: (string | number)[],
): Promise<EmbedContext> {
  const products = new Map<string | number, PayloadProduct>();
  const materials = new Map<string | number, PayloadMaterial>();

  await Promise.all([
    ...productIds.map(async (id) => {
      const p = await fetchProduct(String(id));
      if (p) products.set(id, p);
    }),
    ...materialIds.map(async (id) => {
      void id;
    }),
  ]);

  return { products, materials };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const { productIds, materialIds } = extractEmbeddedIds(article.body);
  const embeds = await fetchEmbeds(productIds, materialIds);

  const coverUrl = mediaUrl(article.cover ?? null);
  const jsonLdCrumbs = [
    { name: 'خانه', url: '/' },
    { name: 'ژورنال', url: '/journal' },
    ...(article.category
      ? [{ name: article.category.name, url: `/journal/category/${article.category.slug}` }]
      : []),
    { name: article.title, url: `/journal/${article.slug}` },
  ];

  const breadcrumbItems = [
    { label: 'خانه' as const, href: '/' },
    { label: 'ژورنال' as const, href: '/journal' },
    ...(article.category
      ? [{ label: article.category.name, href: `/journal/category/${article.category.slug}` }]
      : []),
    { label: article.title },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articlePageJsonLd({
              headline: article.title,
              url: `${SITE_URL}/journal/${article.slug}`,
              description: article.excerpt ?? undefined,
              datePublished: article.publishedAt ?? undefined,
              authorName: article.author?.name,
              image: coverUrl ?? undefined,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(jsonLdCrumbs, SITE_URL)),
        }}
      />

      <Section padY="sm">
        <Container>
          <Breadcrumbs items={breadcrumbItems} />
        </Container>
      </Section>

      <ArticleHero article={article} />

      <Section padY="lg" fullBleed>
        <Container>
          <div className="mx-auto max-w-[680px]">
            {article.excerpt ? (
              <p className="mb-7 text-lead font-light leading-[var(--leading-lead)] text-stone">
                {article.excerpt}
              </p>
            ) : null}
            <article>
              <ArticleRichText value={article.body} embeds={embeds} />
            </article>
          </div>
        </Container>
      </Section>

      {article.relatedProducts && article.relatedProducts.length > 0 ? (
        <BlockReveal>
          <RelatedProducts products={article.relatedProducts} />
        </BlockReveal>
      ) : null}

      {article.author ? (
        <Section padY="md">
          <Container>
            <div className="mx-auto max-w-[680px]">
              <Stack gap="md">
                <h2 className="text-h3 font-bold text-charcoal">نویسنده</h2>
                <AuthorCard author={article.author} />
              </Stack>
            </div>
          </Container>
        </Section>
      ) : null}

      {article.relatedArticles && article.relatedArticles.length > 0 ? (
        <BlockReveal>
          <RelatedArticles articles={article.relatedArticles} />
        </BlockReveal>
      ) : null}
    </>
  );
}
