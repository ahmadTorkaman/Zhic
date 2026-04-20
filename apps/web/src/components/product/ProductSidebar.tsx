import { MoneyDisplay, Badge, Button } from '@zhic/ui';
import { inquiryHref, type PayloadProduct } from '@/lib/payload';

export type ProductSidebarProps = {
  product: PayloadProduct;
};

export function ProductSidebar({ product }: ProductSidebarProps) {
  const isAvailable = product.availability === 'in_stock';
  const leadDays = product.leadTimeDays ?? 21;

  return (
    /*
     * c-sidebar: cream bg, rounded-lg, padding, sticky with top=var(--space-8)
     * Full-width on mobile, 380px wide on lg+
     */
    <div
      className="lg:w-[380px] w-full rounded-lg border border-sand bg-cream p-7"
      style={{ position: 'sticky', top: 'var(--space-7)', alignSelf: 'start' }}
    >
      {/* 1. Price */}
      {product.basePriceRials != null ? (
        <div className="mb-4 text-h3 font-bold text-charcoal" dir="ltr" style={{ textAlign: 'right' }}>
          <MoneyDisplay rials={product.basePriceRials} />
        </div>
      ) : (
        <div className="mb-4 text-h3 font-bold text-charcoal">استعلام قیمت</div>
      )}

      {/* 2. Badges */}
      <div className="mb-5 flex flex-wrap gap-2">
        {isAvailable ? (
          <Badge variant="meta">موجود</Badge>
        ) : (
          <Badge variant="meta">ناموجود</Badge>
        )}
        {product.featured && <Badge variant="meta">ویژه</Badge>}
      </div>

      {/* 3. CTAs */}
      <div className="mb-5 flex flex-col gap-3">
        <Button as="a" href={inquiryHref(product)} variant="primary" size="lg">
          استعلام قیمت
        </Button>
        <Button as="a" href="/contact" variant="ghost" size="lg">
          رزرو بازدید
        </Button>
      </div>

      {/* 4. Lead time */}
      <div className="border-t border-sand pt-4 text-small text-stone">
        تحویل {leadDays} روز کاری
      </div>

      {/* 5. SKU */}
      {product.sku && (
        <p className="mt-3 text-eyebrow text-stone" dir="ltr">
          SKU: {product.sku}
        </p>
      )}
      {!product.sku && (
        <p className="mt-3 text-eyebrow text-stone" dir="ltr">
          SKU: —
        </p>
      )}
    </div>
  );
}
