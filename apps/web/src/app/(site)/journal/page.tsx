import { notFound } from 'next/navigation';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { PageHeader } from '@/components/hero/PageHeader';
import { JournalFeaturedArticle } from '@/components/journal/JournalFeaturedArticle';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { fetchArticles } from '@/lib/payload';

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function JournalIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const articlesPage = await fetchArticles({ page });

  // Featured = first article on page 1; grid = rest on page 1, or all on subsequent pages.
  const showFeatured = page === 1 && articlesPage.docs.length > 0;
  const featured = showFeatured ? articlesPage.docs[0] : null;
  const gridArticles = showFeatured ? articlesPage.docs.slice(1) : articlesPage.docs;

  const hrefForPage = (n: number) => (n <= 1 ? '/journal' : `/journal?page=${n}`);

  return (
    <>
      <Container>
        <div className="pt-6">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'ژورنال' }]} />
        </div>
      </Container>

      <PageHeader
        title="ژورنال"
        subtitle="یادداشت‌ها، مصاحبه‌ها، و داستان‌های پشت ساخت هر قطعه — از کارگاه ما در همدان."
      />

      <Container>
        {featured ? (
          <div className="mb-[var(--space-8)]">
            <JournalFeaturedArticle article={featured} />
          </div>
        ) : null}

        <JournalGrid articles={gridArticles} />

        <Pagination
          currentPage={articlesPage.page}
          totalPages={articlesPage.totalPages}
          hrefFor={hrefForPage}
        />
      </Container>

      <div className="pb-12" />
    </>
  );
}

export function generateMetadata() { return { title: 'ژورنال' }; }
