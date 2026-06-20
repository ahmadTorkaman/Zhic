import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getLeafContent, SEEDED_LEAF_SLUGS } from '@/lib/leaf-content';
import { MosaicHero } from '@/components/bedroom-furniture-mosaic/MosaicHero';
import { ProductMosaic } from '@/components/bedroom-furniture-mosaic/ProductMosaic';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'Lab — برگ دسته‌بندی (محصولات)',
  robots: { index: false, follow: false },
};

/**
 * Preview of the LEAF product-listing template (Phase 2 of the
 * /bedroom-furniture/[slug] redesign). Hub-language hero + a uniform grid of
 * product cards (photo + glass band: name + toman price + struck sale). No CMS,
 * no global chrome. Filters are a follow-up step.
 */
export default async function LabCategoryLeafPage() {
  const leaves = (await Promise.all(SEEDED_LEAF_SLUGS.map(getLeafContent))).filter(
    (l): l is NonNullable<typeof l> => l != null,
  );

  return (
    <main className="min-h-screen bg-ivory">
      {leaves.map((leaf) => (
        <div
          key={leaf.slug}
          className="mx-auto w-full max-w-[430px]"
          style={{ containerType: 'inline-size' }}
        >
          <div className="px-4 pt-6">
            <Breadcrumbs
              items={[
                { label: 'خانه', href: '/' },
                { label: 'مبلمان اتاق خواب', href: '/bedroom-furniture' },
                { label: 'میز', href: '/bedroom-furniture/table' },
                { label: leaf.hero.title },
              ]}
            />
          </div>

          <div className="mt-[34px]">
            <MosaicHero title={leaf.hero.title} subtitle={leaf.hero.subtitle} tagline={leaf.hero.tagline} />
          </div>

          <div className="mt-[26px]">
            <ProductMosaic heading={leaf.heading} products={leaf.products} />
          </div>

          <div className="mt-[34px] px-[11px] pb-12">
            <BrandDivider />
          </div>
        </div>
      ))}
    </main>
  );
}
