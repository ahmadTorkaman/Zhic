import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import { fetchArticles, fetchJournalCategories } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, blogJsonLd } from '@/lib/jsonld';
import { JournalFeaturedArticle } from '@/components/journal/JournalFeaturedArticle';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { JournalCategoryNav } from '@/components/journal/JournalCategoryNav';
import { Pagination } from '@/components/products/Pagination';

const PAGE_TITLE = 'ژورنال';
const PAGE_DESCRIPTION =
  'یادداشت‌هایی درباره‌ی چوب، پارچه، طراحی داخلی و سبک زندگی — از تیم ژیک.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/journal' },
  openGraph: {
    type: 'website',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default async function JournalIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageNum = Number(sp.page) || 1;

  const [result, categories] = await Promise.all([
    fetchArticles({ page: pageNum }),
    fetchJournalCategories(),
  ]);

  const jsonLdCrumbs = [
    { name: 'خانه', url: '/' },
    { name: PAGE_TITLE, url: '/journal' },
  ];

  const showFeatured = pageNum === 1 && result.docs.length > 0;
  const featuredArticle = showFeatured ? result.docs[0] : null;
  const restArticles = showFeatured ? result.docs.slice(1) : result.docs;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogJsonLd({
            name: PAGE_TITLE,
            url: `${SITE_URL}/journal`,
            description: PAGE_DESCRIPTION,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(jsonLdCrumbs, SITE_URL)),
        }}
      />

      <Section padY="md">
        <Container>
          <Breadcrumbs items={[
            { label: 'خانه', href: '/' },
            { label: PAGE_TITLE },
          ]} />
        </Container>
      </Section>

      <Section padY="sm" fullBleed>
        <Container>
          <Stack gap="lg">
            <div>
              <h1 className="text-h2 font-black text-ink">{PAGE_TITLE}</h1>
              <p className="mt-2 text-lead font-light text-stone">{PAGE_DESCRIPTION}</p>
            </div>

            <JournalCategoryNav categories={categories} />

            {featuredArticle ? (
              <>
                <JournalFeaturedArticle article={featuredArticle} />
                <div className="mb-7 h-px bg-sand" aria-hidden />
              </>
            ) : null}

            <JournalGrid articles={restArticles} />

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              basePath="/journal"
              searchParams={{}}
            />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
