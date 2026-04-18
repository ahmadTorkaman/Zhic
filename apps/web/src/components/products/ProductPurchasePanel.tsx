import { toPersianDigits } from '@zhic/locale';
import { Badge, Button, MoneyDisplay } from '@zhic/ui';
import type { PayloadProduct } from '@/lib/payload';
import { inquiryHref } from '@/lib/payload';
import { AVAILABILITY_LABEL } from '@/lib/products';

type Props = {
  product: PayloadProduct;
};

const AVAILABILITY_VARIANT: Record<
  NonNullable<PayloadProduct['availability']>,
  'success' | 'neutral' | 'warning'
> = {
  in_stock: 'success',
  made_to_order: 'neutral',
  backorder: 'warning',
  discontinued: 'neutral',
};

export function ProductPurchasePanel({ product }: Props) {
  const availability = product.availability ?? null;
  const showLeadTime =
    typeof product.leadTimeDays === 'number' && product.leadTimeDays > 0;

  return (
    <aside className="self-start rounded-lg bg-cream p-7 md:sticky md:top-8">
      {typeof product.basePriceRials === 'number' ? (
        <div className="mb-4 text-h3 font-bold text-charcoal" dir="ltr">
          <MoneyDisplay rials={product.basePriceRials} />
        </div>
      ) : null}
      {availability ? (
        <div className="mb-5 flex flex-wrap gap-2">
          <Badge variant={AVAILABILITY_VARIANT[availability]} size="md">
            {AVAILABILITY_LABEL[availability]}
          </Badge>
        </div>
      ) : null}
      <div className="mb-5 flex flex-col gap-3">
        <Button as="a" href={inquiryHref(product)} variant="secondary" size="md" className="w-full">
          استعلام قیمت
        </Button>
        <Button as="a" href="/showrooms" variant="ghost" size="md" className="w-full">
          رزرو بازدید
        </Button>
      </div>
      {showLeadTime ? (
        <div className="border-t border-sand pt-4 text-small text-stone">
          تحویل {toPersianDigits(product.leadTimeDays as number)} روز کاری
        </div>
      ) : null}
      {product.sku ? (
        <p className="mt-3 text-eyebrow text-stone" dir="ltr">
          SKU: {product.sku}
        </p>
      ) : null}
    </aside>
  );
}
