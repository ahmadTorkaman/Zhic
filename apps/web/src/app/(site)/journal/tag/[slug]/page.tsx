import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getJournalTagContent } from '@/lib/journal-content';
import { JournalLayout } from '@/components/journal/JournalLayout';
import { fetchTag } from '@/lib/payload';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * /journal/tag/[slug] — the /journal index template (JournalLayout), filled with
 * this tag's articles. Tag pages omit the category pills (tabs are a
 * category-only concept). The old Container/PageHeader/JournalGrid listing is gone.
 */
export default async function JournalTagPage({ params }: PageProps) {
  const { slug: raw } = await params;
  // Next leaves Persian dynamic segments URL-encoded; decode to match the slug.
  const slug = decodeURIComponent(raw);

  const data = await getJournalTagContent(slug);
  if (!data) notFound();

  return (
    <JournalLayout
      content={data.content}
      breadcrumbs={[
        { label: 'خانه', href: '/' },
        { label: 'ژورنال', href: '/journal' },
        { label: data.tag.name },
      ]}
      showTabs={false}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const tag = await fetchTag(slug);
  return { title: tag?.name ?? 'برچسب' };
}
