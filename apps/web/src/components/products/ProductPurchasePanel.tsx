import { toPersianDigits } from '@zhic/locale';
import { Badge, Button, MoneyDisplay, Stack } from '@zhic/ui';
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
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <Stack gap="md">
        <h1 className="text-h2 font-bold text-charcoal text-balance">
          {product.name}
        </h1>
        {product.tagline ? (
          <p className="text-lead text-stone">{product.tagline}</p>
        ) : null}
        {typeof product.basePriceRials === 'number' ? (
          <div className="text-h3 font-bold text-charcoal">
            <MoneyDisplay rials={product.basePriceRials} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {availability ? (
            <Badge variant={AVAILABILITY_VARIANT[availability]} size="md">
              {AVAILABILITY_LABEL[availability]}
            </Badge>
          ) : null}
          {showLeadTime ? (
            <span className="text-small text-stone">
              تحویل {toPersianDigits(product.leadTimeDays as number)} روز کاری
            </span>
          ) : null}
        </div>
        <Stack gap="sm">
          <Button as="a" href={inquiryHref(product)} variant="primary" size="lg">
            استعلام قیمت
          </Button>
          <Button as="a" href="/showrooms" variant="secondary" size="md">
            رزرو بازدید از شوروم
          </Button>
        </Stack>
        {product.sku ? (
          <p
            className="text-small text-stone"
            // SKUs are ASCII; isolate from RTL run for clean display
            dir="ltr"
          >
            SKU: {product.sku}
          </p>
        ) : null}
      </Stack>
    </aside>
  );
}
