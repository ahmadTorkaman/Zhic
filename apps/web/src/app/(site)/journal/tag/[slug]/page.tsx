import { notFound } from 'next/navigation';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { PageHeader } from '@/components/hero/PageHeader';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { fetchTag, fetchArticles, journalTagPath } from '@/lib/payload';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JournalTagPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const [tag, articlesPage] = await Promise.all([
    fetchTag(slug),
    fetchArticles({ tag: slug, page }),
  ]);

  if (!tag) notFound();

  const hrefForPage = (n: number) => (n <= 1 ? journalTagPath(slug) : `${journalTagPath(slug)}?page=${n}`);

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[
            { label: 'خانه', href: '/' },
            { label: 'ژورنال', href: '/journal' },
            { label: tag.name },
          ]} />
        </div>
      </Container>

      <PageHeader
        title={tag.name}
        subtitle={`مقاله‌های برچسب «${tag.name}»`}
      />

      <Container>
        <JournalGrid articles={articlesPage.docs} />
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

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tag = await fetchTag(slug);
  return { title: tag?.name ?? 'برچسب' };
}
