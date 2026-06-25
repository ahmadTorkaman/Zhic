import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getJournalCategoryContent } from '@/lib/journal-content';
import { JournalLayout } from '@/components/journal/JournalLayout';
import { fetchJournalCategory } from '@/lib/payload';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * /journal/category/[slug] — the /journal index template (JournalLayout),
 * filled with this category's articles and its filter pill active. The old
 * Container/PageHeader/JournalGrid listing is gone.
 */
export default async function JournalCategoryPage({ params }: PageProps) {
  const { slug: raw } = await params;
  // Next leaves Persian dynamic segments URL-encoded; decode to match the slug.
  const slug = decodeURIComponent(raw);

  const data = await getJournalCategoryContent(slug);
  if (!data) notFound();

  return (
    <JournalLayout
      content={data.content}
      breadcrumbs={[
        { label: 'خانه', href: '/' },
        { label: 'ژورنال', href: '/journal' },
        { label: data.category.name },
      ]}
      showTabs
      activeTab={slug}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const category = await fetchJournalCategory(slug);
  return { title: category?.name ?? 'دسته‌بندی' };
}
