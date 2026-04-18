import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import { fetchArticles, fetchJournalCategories } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, blogJsonLd } from '@/lib/jsonld';
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

      <Section padY="lg">
        <Container>
          <Stack gap="lg">
            <div>
              <Breadcrumbs items={[
                { label: 'خانه', href: '/' },
                { label: PAGE_TITLE },
              ]} />
              <h1 className="mt-4 text-h1 font-bold text-charcoal">
                {PAGE_TITLE}
              </h1>
              <p className="mt-2 text-lead text-stone">{PAGE_DESCRIPTION}</p>
            </div>

            <JournalCategoryNav categories={categories} />

            <JournalGrid articles={result.docs} />

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
