import { Breadcrumbs, type BreadcrumbItem } from '@zhic/ui';
import type { JournalContent } from '@/lib/journal-content';
import { JournalIntro } from './JournalIntro';
import { JournalTabs } from './JournalTabs';
import { JournalFeaturedCard } from './JournalFeaturedCard';
import { JournalNumberedList } from './JournalNumberedList';
import { JournalSectionHeading } from './JournalSectionHeading';
import { JournalQuote } from './JournalQuote';
import { JournalArticleCards } from './JournalArticleCards';
import { JournalProductCTA } from './JournalProductCTA';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export type JournalLayoutProps = {
  content: JournalContent;
  breadcrumbs: BreadcrumbItem[];
  /** Show the category filter pills (index + category pages; off for tag pages). */
  showTabs?: boolean;
  /** Active tab key; falls back to content.activeTab. */
  activeTab?: string;
};

/**
 * The /journal index template (Figma 227:478) as a reusable shell: 430-standard
 * column, intro → divider → tabs → featured → numbered list → «فهرست کامل» (quote
 * + editorial cards) → product CTA → divider. Driven entirely by `content`, so
 * the index, category, and tag pages render identically. Article-fed sections
 * (featured / numbered list / editorial cards) are hidden when their slots are
 * empty; an empty featured slot shows a "no articles" message instead.
 */
export function JournalLayout({
  content: c,
  breadcrumbs,
  showTabs = true,
  activeTab,
}: JournalLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
      <div className="px-4 pt-[calc(var(--header-height)+var(--space-5))]">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="mt-4 px-[13px]">
        <JournalIntro title={c.intro} />
      </div>
      <div className="mt-4 px-[13px]">
        <BrandDivider />
      </div>

      {showTabs && c.tabs.length > 0 ? (
        <div className="mt-5 px-[12px]">
          <JournalTabs tabs={c.tabs} activeKey={activeTab ?? c.activeTab} />
        </div>
      ) : null}

      {c.featured ? (
        <div className="mt-5 px-[12px]">
          <JournalFeaturedCard article={c.featured} />
        </div>
      ) : (
        <p className="mt-8 px-[12px] py-9 text-center text-stone">مقاله‌ای پیدا نشد.</p>
      )}

      {c.topList.length > 0 ? (
        <div className="mt-3 px-[12px]">
          <JournalNumberedList articles={c.topList} />
        </div>
      ) : null}

      {c.cards.length > 0 ? (
        <>
          <div className="mt-6 px-[12px]">
            <JournalSectionHeading title={c.fullListHeading ?? 'فهرست کامل'} />
          </div>
          <div className="mt-4 px-[12px]">
            <JournalQuote quote={c.quote} />
          </div>
          <div className="mt-5 px-[12px]">
            <JournalArticleCards cards={c.cards} />
          </div>
        </>
      ) : null}

      <div className="mt-4 px-[12px]">
        <JournalProductCTA cta={c.productCta} />
      </div>
      <div className="mt-6 px-[12px] pb-[40px]">
        <BrandDivider />
      </div>
    </div>
  );
}
