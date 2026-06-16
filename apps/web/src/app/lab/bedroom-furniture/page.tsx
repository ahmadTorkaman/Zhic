import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getBedroomFurnitureContent } from '@/lib/bedroom-furniture';
import { BedroomHero } from '@/components/bedroom-furniture/BedroomHero';
import { CategoryShowcase } from '@/components/bedroom-furniture/CategoryShowcase';
import { RoomCategoryGrid } from '@/components/bedroom-furniture/RoomCategoryGrid';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'Lab — مبلمان اتاق خواب',
  robots: { index: false, follow: false },
};

/**
 * Standalone preview of the /bedroom-furniture rebuild (Figma frame 191:207),
 * BODY only — no CMS, no global chrome. Mirrors the real route's composition.
 * `container-type: inline-size` makes the cqw units resolve against the 430
 * column → pixel-exact at 430, fluid below.
 */
export default async function LabBedroomFurniturePage() {
  const { showcase, showcaseInitial, rooms, lorem } = await getBedroomFurnitureContent();

  return (
    <main className="min-h-screen bg-ivory">
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <div className="px-4 pt-6">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'مبلمان اتاق خواب' }]} />
        </div>

        <div className="mt-4">
          <BedroomHero />
        </div>

        <div className="relative z-[3] px-[11px]" id="bf-categories">
          <CategoryShowcase slides={showcase} lorem={lorem} initialActive={showcaseInitial} />
        </div>

        <div className="mt-5 px-[11px]">
          <RoomCategoryGrid rooms={rooms} />
        </div>

        <div className="mt-[28px] px-[11px] pb-12">
          <BrandDivider />
        </div>
      </div>
    </main>
  );
}
