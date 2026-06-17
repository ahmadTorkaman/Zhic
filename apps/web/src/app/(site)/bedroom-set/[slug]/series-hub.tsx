import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getSeriesHubContent } from '@/lib/series-hub-content';
import { SeriesHubBody } from '@/components/series-hub/SeriesHubBody';
import type { OccupancySlug } from './occupancy';

/** Series-hub metadata. The canonical ALWAYS points at the bare series URL —
 *  the /bedroom-set/[age]/[series] views are unpromoted facets (conservative
 *  default per the SEO playbook's facet-page promotion rule), so they
 *  canonicalize to the parent instead of indexing themselves. Title/description/
 *  OG come from the same content getter the page renders (iron → static seed,
 *  other designs → Payload), so metadata never disagrees with the page. */
export async function seriesHubMetadata(slug: string): Promise<Metadata> {
  const content = await getSeriesHubContent(slug);
  if (!content) return { title: 'یافت نشد' };
  return {
    title: content.title.name,
    description: content.title.subtitle ?? `طرح ${content.title.name} — مبلمان دست‌ساز ژیک`,
    alternates: { canonical: `/bedroom-set/${slug}` },
    openGraph: {
      title: content.title.name,
      description: content.title.subtitle ?? undefined,
      images: content.hero.img ? [{ url: content.hero.img }] : undefined,
    },
  };
}

export type SeriesHubProps = {
  slug: string;
  /** Occupancy the visitor arrived through (first path segment on
   *  /bedroom-set/[age]/[series]). Occupancy is a DESIGN-level property, so it
   *  doesn't filter the set — it only colours the page's age context (subtitle,
   *  sibling links). */
  ageFilter?: OccupancySlug;
};

/**
 * Design-detail page, rebuilt from the Kaveh @430 comp (Figma 261:90). The body
 * is a 430-standard centered column (container-type: inline-size, cqw units),
 * fed by the props-driven `getSeriesHubContent` getter — iron is a pixel-exact
 * static seed; every other design maps live from Payload into the same shape.
 * Global chrome (header / consultation CTA / footer) comes from the (site)
 * layout.
 */
export async function SeriesHub({ slug, ageFilter }: SeriesHubProps) {
  const content = await getSeriesHubContent(slug, ageFilter);
  if (!content) notFound();

  return (
    <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
      <div className="px-[12px] pb-2 pt-[calc(var(--header-height)+var(--space-5))]">
        <Breadcrumbs
          items={[
            { label: 'خانه', href: '/' },
            { label: 'سرویس خواب', href: '/bedroom-set' },
            { label: content.title.name },
          ]}
        />
      </div>
      <SeriesHubBody content={content} />
    </div>
  );
}
