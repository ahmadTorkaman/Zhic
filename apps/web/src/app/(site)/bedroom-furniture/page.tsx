import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { getBedroomFurnitureContent } from '@/lib/bedroom-furniture';
import { BedroomHero } from '@/components/bedroom-furniture/BedroomHero';
import { CategoryShowcase } from '@/components/bedroom-furniture/CategoryShowcase';
import { BedroomRevealScene } from '@/components/bedroom-furniture/BedroomRevealScene';
import { RoomCategoryGrid } from '@/components/bedroom-furniture/RoomCategoryGrid';
import { BrandDivider } from '@/components/bedroom-furniture/BrandDivider';

export const metadata: Metadata = {
  title: 'مبلمان اتاق خواب',
  description:
    'تمامی پیکربندی‌های مبلمان اتاق خواب ژیک — تخت، کمد، میز، کتابخانه، صندلی، آینه و مکمل‌های تخت.',
  alternates: { canonical: '/bedroom-furniture' },
};

/**
 * /bedroom-furniture — rebuilt from Figma frame 191:207 (see
 * docs/superpowers/figma-kaveh/bedroom-furniture-rebuild-spec-430.md).
 * Body sits in a 430-standard column; the global SiteHeader/Footer (and the
 * consultation CTA) wrap it via (site)/layout.tsx. Content is seeded for now
 * (see lib/bedroom-furniture) and swaps to Payload later without touching this.
 */
export default async function BedroomFurnitureRootPage() {
  const { showcase, showcaseInitial, rooms, lorem } = await getBedroomFurnitureContent();

  return (
    <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
      <div className="px-4 pt-[calc(var(--header-height)+var(--space-5))]">
        <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'مبلمان اتاق خواب' }]} />
      </div>

      {/* Scroll reveal: the hero pins while the showcase card rises over it and
          zooms to full-bleed, then releases locked behind the card. */}
      <div className="mt-4" id="bf-categories">
        <BedroomRevealScene
          hero={<BedroomHero />}
          showcase={<CategoryShowcase slides={showcase} lorem={lorem} initialActive={showcaseInitial} />}
        />
      </div>

      <div className="mt-5 px-[11px]">
        <RoomCategoryGrid rooms={rooms} />
      </div>

      {/* zhic wordmark divider beneath the grid (Figma 191:246) */}
      <div className="mt-[28px] px-[11px] pb-10">
        <BrandDivider />
      </div>
    </div>
  );
}
