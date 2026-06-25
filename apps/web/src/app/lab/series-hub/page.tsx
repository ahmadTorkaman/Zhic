import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getSeriesOccupancyContent } from '@/lib/series-hub-content';
import { SeriesHubBody } from '@/components/series-hub/SeriesHubBody';

export const metadata: Metadata = {
  title: 'Lab — سرویس خواب آیرون',
  robots: { index: false, follow: false },
};

/**
 * Standalone preview of the /bedroom-set/[age]/[design] detail rebuild
 * (Figma frame 261:90), seeded with iron (آیرون). BODY only — no CMS, no global
 * chrome. `container-type: inline-size` resolves the cqw units against the 430
 * column (pixel-exact at 430, fluid below).
 */
export default async function LabSeriesHubPage() {
  const result = await getSeriesOccupancyContent('teen', 'iron');
  if (!result) return null;
  const { content } = result;

  return (
    <main className="min-h-screen bg-ivory">
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <div className="px-[12px] pb-2 pt-6">
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
    </main>
  );
}
