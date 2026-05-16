import { notFound } from 'next/navigation';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { PageHeader } from '@/components/hero/PageHeader';
import { JournalCategoryNav } from '@/components/journal/JournalCategoryNav';
import { JournalGrid } from '@/components/journal/JournalGrid';
import {
  fetchJournalCategory,
  fetchJournalCategories,
  fetchArticles,
  journalCategoryPath,
} from '@/lib/payload';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JournalCategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const [category, articlesPage, categories] = await Promise.all([
    fetchJournalCategory(slug),
    fetchArticles({ category: slug, page }),
    fetchJournalCategories(),
  ]);

  if (!category) notFound();

  const hrefForPage = (n: number) => (n <= 1 ? journalCategoryPath(slug) : `${journalCategoryPath(slug)}?page=${n}`);

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[
            { label: 'خانه', href: '/' },
            { label: 'ژورنال', href: '/journal' },
            { label: category.name },
          ]} />
        </div>
      </Container>

      <PageHeader
        title={category.name}
        subtitle={category.description ?? 'مقاله‌های این دسته‌بندی.'}
      />

      <Container>
        {categories.length > 0 ? (
          <JournalCategoryNav categories={categories} activeSlug={slug} />
        ) : null}

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
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const category = await fetchJournalCategory(slug);
  return { title: category?.name ?? 'دسته‌بندی' };
}
