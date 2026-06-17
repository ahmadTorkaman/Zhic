import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getJournalContent } from '@/lib/journal-content';
import { JournalIntro } from '@/components/journal/JournalIntro';
import { JournalTabs } from '@/components/journal/JournalTabs';
import { JournalFeaturedCard } from '@/components/journal/JournalFeaturedCard';
import { JournalNumberedList } from '@/components/journal/JournalNumberedList';
import { JournalSectionHeading } from '@/components/journal/JournalSectionHeading';
import { JournalQuote } from '@/components/journal/JournalQuote';
import { JournalArticleCards } from '@/components/journal/JournalArticleCards';
import { JournalProductCTA } from '@/components/journal/JournalProductCTA';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'ژورنال',
  description: 'ایده‌ها، راهنماها و ترندهای دکوراسیون برای خانه‌ای که دوستش دارید.',
  alternates: { canonical: '/journal' },
};

/**
 * /journal index — rebuilt from Figma frame 227:478 ("/journals"). See
 * docs/superpowers/figma-kaveh/journal-rebuild-spec-430.md. Body in a
 * 430-standard column; global SiteHeader/Footer + consultation CTA wrap it via
 * (site)/layout.tsx. Content is seeded (lib/journal-content) and swaps to
 * Payload (fetchArticles/fetchJournalCategories) later without touching this.
 */
export default async function JournalIndexPage() {
  const c = await getJournalContent();

  return (
    <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
      <div className="px-4 pt-[calc(var(--header-height)+var(--space-5))]">
        <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'ژورنال' }]} />
      </div>

      <div className="mt-4 px-[13px]">
        <JournalIntro title={c.intro} />
      </div>
      <div className="mt-4 px-[13px]">
        <BrandDivider />
      </div>
      <div className="mt-5 px-[12px]">
        <JournalTabs tabs={c.tabs} activeKey={c.activeTab} />
      </div>
      <div className="mt-5 px-[12px]">
        <JournalFeaturedCard article={c.featured} />
      </div>
      <div className="mt-3 px-[12px]">
        <JournalNumberedList articles={c.topList} />
      </div>
      <div className="mt-6 px-[12px]">
        <JournalSectionHeading title={c.fullListHeading ?? 'فهرست کامل'} />
      </div>
      <div className="mt-4 px-[12px]">
        <JournalQuote quote={c.quote} />
      </div>
      <div className="mt-5 px-[12px]">
        <JournalArticleCards cards={c.cards} />
      </div>
      <div className="mt-4 px-[12px]">
        <JournalProductCTA cta={c.productCta} />
      </div>
      <div className="mt-6 px-[12px] pb-[40px]">
        <BrandDivider />
      </div>
    </div>
  );
}
