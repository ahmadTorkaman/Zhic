import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import { fetchArticles, fetchTag } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/jsonld';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { Pagination } from '@/components/products/Pagination';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await fetchTag(slug);
  if (!tag) return { title: 'تگ یافت نشد' };
  return {
    title: `تگ: ${tag.name} — ژورنال`,
    alternates: { canonical: `/journal/tag/${slug}` },
    openGraph: {
      type: 'website',
      title: `تگ: ${tag.name}`,
    },
  };
}

export default async function JournalTagPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const pageNum = Number(sp.page) || 1;

  const [tag, result] = await Promise.all([
    fetchTag(slug),
    fetchArticles({ tag: slug, page: pageNum }),
  ]);

  if (!tag) notFound();

  const jsonLdCrumbs = [
    { name: 'خانه', url: '/' },
    { name: 'ژورنال', url: '/journal' },
    { name: `تگ: ${tag.name}`, url: `/journal/tag/${tag.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionPageJsonLd({
              name: tag.name,
              url: `${SITE_URL}/journal/tag/${tag.slug}`,
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
                { label: `تگ: ${tag.name}` },
              ]} />
              <h1 className="mt-4 text-h1 font-bold text-charcoal">
                تگ: {tag.name}
              </h1>
            </div>

            <JournalGrid articles={result.docs} />

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              basePath={`/journal/tag/${slug}`}
              searchParams={{}}
            />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
