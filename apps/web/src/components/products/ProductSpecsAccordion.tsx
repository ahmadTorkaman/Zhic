import type { ReactNode } from 'react';
import { toPersianDigits } from '@zhic/locale';
import { Tag } from '@zhic/ui';
import type { PayloadProduct } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

type Props = {
  product: PayloadProduct;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details
      open
      className="group border-b border-sand/60 py-4 last:border-b-0"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 list-none [&::-webkit-details-marker]:hidden">
        <span className="text-h4 font-bold text-charcoal">{title}</span>
        <Chevron />
      </summary>
      <div className="mt-3 text-body text-stone">{children}</div>
    </details>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 8"
      width="12"
      height="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="text-stone transition-transform group-open:rotate-180"
    >
      <path d="M1 1.5 L6 6.5 L11 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductSpecsAccordion({ product }: Props) {
  const dims = product.dimensions;
  const hasDims =
    dims &&
    (typeof dims.width === 'number' ||
      typeof dims.height === 'number' ||
      typeof dims.depth === 'number');
  const materialNames = (product.materialIds ?? [])
    .map((m) => m.name)
    .filter(Boolean);
  const showLeadTime =
    typeof product.leadTimeDays === 'number' && product.leadTimeDays > 0;
  const hasSpecs = Boolean(product.specs);

  if (!hasDims && materialNames.length === 0 && !showLeadTime && !hasSpecs) {
    return null;
  }

  return (
    <div className="border-y border-sand/60">
      {hasDims ? (
        <Section title="ابعاد">
          <ul className="space-y-1">
            {typeof dims?.width === 'number' ? (
              <li>
                عرض: {toPersianDigits(dims.width)} سانتی‌متر
              </li>
            ) : null}
            {typeof dims?.height === 'number' ? (
              <li>
                ارتفاع: {toPersianDigits(dims.height)} سانتی‌متر
              </li>
            ) : null}
            {typeof dims?.depth === 'number' ? (
              <li>
                عمق: {toPersianDigits(dims.depth)} سانتی‌متر
              </li>
            ) : null}
          </ul>
        </Section>
      ) : null}
      {materialNames.length > 0 ? (
        <Section title="متریال">
          <div className="flex flex-wrap gap-2">
            {materialNames.map((m, idx) => (
              <Tag key={idx} variant="neutral" size="md">
                {m}
              </Tag>
            ))}
          </div>
        </Section>
      ) : null}
      {showLeadTime ? (
        <Section title="زمان تحویل">
          {toPersianDigits(product.leadTimeDays as number)} روز کاری
        </Section>
      ) : null}
      {hasSpecs ? (
        <Section title="مشخصات فنی">
          <RichText value={product.specs ?? null} />
        </Section>
      ) : null}
    </div>
  );
}
