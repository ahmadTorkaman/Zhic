import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import {
  fetchArticles,
  fetchJournalCategories,
  fetchJournalCategory,
} from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/jsonld';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { JournalCategoryNav } from '@/components/journal/JournalCategoryNav';
import { Pagination } from '@/components/products/Pagination';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchJournalCategory(slug);
  if (!category) return { title: 'دسته‌بندی یافت نشد' };
  return {
    title: `${category.name} — ژورنال`,
    description: category.description ?? undefined,
    alternates: { canonical: `/journal/category/${slug}` },
    openGraph: {
      type: 'website',
      title: category.name,
      description: category.description ?? undefined,
    },
  };
}

export default async function JournalCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const pageNum = Number(sp.page) || 1;

  const [category, result, categories] = await Promise.all([
    fetchJournalCategory(slug),
    fetchArticles({ category: slug, page: pageNum }),
    fetchJournalCategories(),
  ]);

  if (!category) notFound();

  const jsonLdCrumbs = [
    { name: 'خانه', url: '/' },
    { name: 'ژورنال', url: '/journal' },
    { name: category.name, url: `/journal/category/${category.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionPageJsonLd({
              name: category.name,
              url: `${SITE_URL}/journal/category/${category.slug}`,
              description: category.description ?? undefined,
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

      <Section padY="lg">
        <Container>
          <Stack gap="lg">
            <div>
              <Breadcrumbs items={[
                { label: 'خانه', href: '/' },
                { label: 'ژورنال', href: '/journal' },
                { label: category.name },
              ]} />
              <h1 className="mt-4 text-h1 font-bold text-charcoal">
                {category.name}
              </h1>
              {category.description ? (
                <p className="mt-2 text-lead text-stone">{category.description}</p>
              ) : null}
            </div>

            <JournalCategoryNav categories={categories} activeSlug={slug} />

            <JournalGrid articles={result.docs} />

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              basePath={`/journal/category/${slug}`}
              searchParams={{}}
            />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
