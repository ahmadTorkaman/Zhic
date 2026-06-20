import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { buildMosaicRows } from '@/lib/bedroom-furniture-mosaic';
import { getOccupancyHubContent, OCCUPANCY_HUB_SLUGS } from '@/lib/occupancy-hub-content';
import { BedroomHero } from '@/components/bedroom-furniture/BedroomHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { MosaicStrip } from '@/components/bedroom-furniture-mosaic/MosaicStrip';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'Lab — سرویس خواب (هاب گروه سنی)',
  robots: { index: false, follow: false },
};

/**
 * Prototype of the /bedroom-set/[occupancy] middle hubs rebuilt on the mosaic
 * template. Renders all four occupancy hubs stacked so the adaptive rhythm can
 * be checked at N = teen (many), double (many), baby (few), bunk (few). Static
 * covers; no global chrome. Real route wire-up pending operator review.
 */
export default async function LabBedroomSetHubPage() {
  const hubs = await Promise.all(OCCUPANCY_HUB_SLUGS.map((s) => getOccupancyHubContent(s)));

  return (
    <main className="min-h-screen bg-ivory">
      {hubs.map((hub) => (
        <section key={hub.slug} className="mb-10 border-b border-dashed border-sand pb-10">
          <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
            <div className="px-4 pt-6">
              <Breadcrumbs
                items={[
                  { label: 'خانه', href: '/' },
                  { label: 'سرویس خواب', href: '/bedroom-set' },
                  { label: hub.shortName },
                ]}
              />
              <p className="mt-2 text-[11px] text-stone">
                /bedroom-set/{hub.slug} — {hub.tiles.length} طرح
              </p>
            </div>
            <div className="mt-4">
              <BedroomHero hero={hub.hero} />
            </div>
            <div className="mt-[34px]">
              <CategoryMosaic heading={hub.heading} rows={buildMosaicRows(hub.tiles)} />
            </div>
            {hub.others.length > 0 && (
              <div className="mt-[40px]">
                <MosaicStrip heading="گروه‌های دیگر" items={hub.others} seeAll={hub.othersSeeAll} />
              </div>
            )}
            <div className="mt-[34px] px-[11px] pb-4">
              <BrandDivider />
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
