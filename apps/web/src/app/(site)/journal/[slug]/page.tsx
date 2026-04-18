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
  extractHeadings,
  extractEmbeddedIds,
  type EmbedContext,
} from '@/lib/richtext';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { ArticleHero } from '@/components/journal/ArticleHero';
import { TableOfContents } from '@/components/journal/TableOfContents';
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
    // Materials are fetched individually; batch endpoint not yet available
    ...materialIds.map(async (id) => {
      // For now, material data is already included via depth=3 in article fetch
      // This is a placeholder for explicit fetch if needed
      void id;
    }),
  ]);

  return { products, materials };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const headings = extractHeadings(article.body);
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

      <Section padY="lg">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_240px]">
            <article className="min-w-0">
              <ArticleRichText value={article.body} embeds={embeds} />
            </article>
            <TableOfContents headings={headings} />
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
            <div className="mx-auto max-w-prose">
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
