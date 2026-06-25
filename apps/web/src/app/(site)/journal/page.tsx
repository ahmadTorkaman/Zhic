import type { Metadata } from 'next';
import { getJournalContent } from '@/lib/journal-content';
import { JournalLayout } from '@/components/journal/JournalLayout';

export const metadata: Metadata = {
  title: 'ژورنال',
  description: 'ایده‌ها، راهنماها و ترندهای دکوراسیون برای خانه‌ای که دوستش دارید.',
  alternates: { canonical: '/journal' },
};

/**
 * /journal index — rebuilt from Figma frame 227:478 ("/journals"). See
 * docs/superpowers/figma-kaveh/journal-rebuild-spec-430.md. The template lives
 * in JournalLayout (shared with the category/tag pages); content is seeded
 * (lib/journal-content) and swaps to Payload (fetchJournal) without touching it.
 */
export default async function JournalIndexPage() {
  const content = await getJournalContent();

  return (
    <JournalLayout
      content={content}
      breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'ژورنال' }]}
      showTabs
      activeTab={content.activeTab}
    />
  );
}
