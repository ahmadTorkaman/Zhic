import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { buildMosaicRows } from '@/lib/bedroom-furniture-mosaic';
import { getHubContent, SEEDED_HUB_SLUGS } from '@/lib/category-hub-content';
import { MosaicHero } from '@/components/bedroom-furniture-mosaic/MosaicHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'Lab — مبلمان اتاق خواب (هاب دسته‌بندی)',
  robots: { index: false, follow: false },
};

/**
 * Preview of the parent-HUB mosaic template (Phase 1 of the
 * /bedroom-furniture/[slug] redesign). Renders the 4 seeded hubs so the
 * adaptive rhythm can be checked at N=2 (table), 3 (mirror), 4 (bed), 6
 * (complement, incl. 2 empty-category fallback tiles). No CMS, no global chrome.
 */
export default async function LabCategoryHubPage() {
  const hubs = (await Promise.all(SEEDED_HUB_SLUGS.map(getHubContent))).filter(
    (h): h is NonNullable<typeof h> => h != null,
  );

  return (
    <main className="min-h-screen bg-ivory">
      {hubs.map((hub) => (
        <section key={hub.slug} className="mb-12 border-b border-dashed border-sand pb-12">
          <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
            <div className="px-4 pt-6">
              <Breadcrumbs
                items={[
                  { label: 'خانه', href: '/' },
                  { label: 'مبلمان اتاق خواب', href: '/bedroom-furniture' },
                  { label: hub.hero.title },
                ]}
              />
            </div>

            <div className="mt-[34px]">
              <MosaicHero title={hub.hero.title} subtitle={hub.hero.subtitle} tagline={hub.hero.tagline} />
            </div>

            <div className="mt-[26px]">
              <CategoryMosaic heading={hub.heading} rows={buildMosaicRows(hub.tiles)} />
            </div>

            <div className="mt-[34px] px-[11px]">
              <BrandDivider />
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] text-stone">
            hub: {hub.slug} · {hub.tiles.length} tiles
          </p>
        </section>
      ))}
    </main>
  );
}
