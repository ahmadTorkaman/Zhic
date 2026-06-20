import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getBedroomFurnitureMosaicContent } from '@/lib/bedroom-furniture-mosaic';
import { MosaicHero } from '@/components/bedroom-furniture-mosaic/MosaicHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'Lab — مبلمان اتاق خواب (موزاییک)',
  robots: { index: false, follow: false },
};

/**
 * Standalone preview of the /bedroom-furniture *mosaic* direction (Figma Kaveh
 * frame 334:105), BODY only — no CMS, no global chrome. Mirrors the real route's
 * composition. `container-type: inline-size` makes the cqw units resolve against
 * the 430 column → pixel-exact at 430, fluid below.
 */
export default async function LabBedroomFurnitureMosaicPage() {
  const { hero, heading, rows } = await getBedroomFurnitureMosaicContent();

  return (
    <main className="min-h-screen bg-ivory">
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <div className="px-4 pt-6">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'مبلمان اتاق خواب' }]} />
        </div>

        <div className="mt-[34px]">
          <MosaicHero {...hero} />
        </div>

        <div className="mt-[26px]">
          <CategoryMosaic heading={heading} rows={rows} />
        </div>

        <div className="mt-[34px] px-[11px] pb-12">
          <BrandDivider />
        </div>
      </div>
    </main>
  );
}
