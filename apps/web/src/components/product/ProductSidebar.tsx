import Link from 'next/link';
import { InfoCard } from './InfoCard';
import { toPersianDigits } from '@zhic/locale';
import type { PayloadProduct } from '@/lib/payload';

export type ProductSidebarProps = {
  product: PayloadProduct;
};

/**
 * Info-only sidebar — price + CTA have moved to the sticky PickerBar.
 * This panel carries secondary specs the picker can't surface inline:
 * طرح callout (with link), زمان تحویل, گارانتی, روکش‌ها.
 */
export function ProductSidebar({ product }: ProductSidebarProps) {
  const designName = typeof product.design === 'object' && product.design ? product.design.name : null;
  const designSlug = typeof product.design === 'object' && product.design ? product.design.slug : null;
  const leadTimeDays = product.leadTimeDays ?? 56;
  const warrantyYears = product.warrantyYears ?? 5;
  const afterSalesYears = product.afterSalesYears ?? 5;
  const materials = (product.materialIds ?? []).map((m) => m.name).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {designName && designSlug ? (
        <InfoCard label="طرح" variant="forest">
          <Link href={`/bedroom-set/${designSlug}`} className="text-ink hover:text-forest">
            <strong>{designName}</strong>
          </Link>
        </InfoCard>
      ) : null}
      <InfoCard label="زمان تحویل">
        {toPersianDigits(leadTimeDays)} روز کاری
      </InfoCard>
      <InfoCard label="گارانتی">
        {toPersianDigits(warrantyYears)} سال ساختار
      </InfoCard>
      <InfoCard label="خدمات پس از فروش">
        {toPersianDigits(afterSalesYears)} سال
      </InfoCard>
      {materials.length > 0 ? (
        <InfoCard label="روکش‌ها">
          {materials.join(' · ')}
        </InfoCard>
      ) : null}
    </div>
  );
}
