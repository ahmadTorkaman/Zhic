import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getSeriesOccupancyContent } from '@/lib/series-hub-content';
import { SeriesHubBody } from '@/components/series-hub/SeriesHubBody';
import type { OccupancySlug } from './occupancy';

/** Metadata for /bedroom-set/{occupancy}/{series}. The page is SELF-canonical and
 *  indexable once the combo is differentiated (published with its own products or
 *  overrides); otherwise it's noindex,follow. Title/description/OG come from the
 *  same resolver the page renders, so they never disagree. */
export async function seriesOccupancyMetadata(occupancy: OccupancySlug, series: string): Promise<Metadata> {
  const result = await getSeriesOccupancyContent(occupancy, series);
  if (!result) return { title: 'یافت نشد' };
  const { content, differentiated } = result;
  const canonical = `/bedroom-set/${occupancy}/${series}`;
  return {
    title: content.title.name,
    description: content.title.subtitle ?? `طرح ${content.title.name} — مبلمان دست‌ساز ژیک`,
    alternates: { canonical },
    robots: differentiated ? undefined : { index: false, follow: true },
    openGraph: {
      title: content.title.name,
      description: content.title.subtitle ?? undefined,
      images: content.hero.img ? [{ url: content.hero.img }] : undefined,
    },
  };
}

/**
 * Design-detail page for one (occupancy × series), rebuilt from the Kaveh @430
 * comp (Figma 261:90). Content is resolved from the published series-occupancies
 * doc overlaid on the design base; un-authored combos render the inherited base.
 */
export async function SeriesHub({ occupancy, series }: { occupancy: OccupancySlug; series: string }) {
  const result = await getSeriesOccupancyContent(occupancy, series);
  if (!result) notFound();
  const { content } = result;

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
