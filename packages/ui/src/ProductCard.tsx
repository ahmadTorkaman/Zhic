import type { ReactNode } from 'react';
import { toPersianDigits } from '@zhic/locale';
import { Aspect } from './Aspect';
import { Badge } from './Badge';
import { cn } from './cn';
import { MoneyDisplay } from './MoneyDisplay';
import { Tag } from './Tag';
import { CARD_BASE, CARD_INTERACTIVE, CARD_IMAGE_ZOOM } from './cardClasses';

type Availability = 'in_stock' | 'made_to_order' | 'backorder' | 'discontinued';

export type ProductCardProps = {
  href?: string;
  name: ReactNode;
  image: ReactNode;
  tagline?: ReactNode;
  priceRials?: number | bigint;
  priceFallback?: ReactNode;
  availability?: Availability;
  leadTimeDays?: number;
  materials?: ReactNode[];
  className?: string;
};

const AVAILABILITY_VARIANT = {
  in_stock: 'success',
  made_to_order: 'neutral',
  backorder: 'warning',
  discontinued: 'neutral',
} as const satisfies Record<Availability, 'success' | 'neutral' | 'warning'>;

const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: 'موجود',
  made_to_order: 'ساخت به‌سفارش',
  backorder: 'در انتظار',
  discontinued: 'ناموجود',
};

function availabilityBadgeLabel(
  availability: Availability,
  leadTimeDays?: number,
): string {
  if (availability === 'made_to_order' && typeof leadTimeDays === 'number') {
    return `${AVAILABILITY_LABEL[availability]} \u00B7 ${toPersianDigits(
      leadTimeDays,
    )} روز`;
  }
  return AVAILABILITY_LABEL[availability];
}

export function ProductCard({
  href,
  name,
  image,
  tagline,
  priceRials,
  priceFallback,
  availability,
  leadTimeDays,
  materials,
  className,
}: ProductCardProps) {
  const rootClass = cn(CARD_BASE, href ? CARD_INTERACTIVE : null, className);
  const hasPriceRow = priceRials !== undefined || priceFallback !== undefined;

  const body = (
    <>
      <Aspect ratio="4/5" className={cn('bg-cream', CARD_IMAGE_ZOOM)}>
        {image}
      </Aspect>
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 font-bold text-balance line-clamp-1">
            {name}
          </h3>
          {tagline ? (
            <p className="text-small text-stone line-clamp-2">{tagline}</p>
          ) : null}
        </div>
        {hasPriceRow ? (
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-body font-bold">
              {priceRials !== undefined ? (
                <MoneyDisplay rials={priceRials} />
              ) : (
                priceFallback
              )}
            </div>
            {availability ? (
              <Badge
                variant={AVAILABILITY_VARIANT[availability]}
                size="sm"
                shape="rounded"
              >
                {availabilityBadgeLabel(availability, leadTimeDays)}
              </Badge>
            ) : null}
          </div>
        ) : availability ? (
          <div>
            <Badge
              variant={AVAILABILITY_VARIANT[availability]}
              size="sm"
              shape="rounded"
            >
              {availabilityBadgeLabel(availability, leadTimeDays)}
            </Badge>
          </div>
        ) : null}
        {materials && materials.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {materials.map((label, idx) => (
              <Tag key={idx} variant="neutral" size="sm">
                {label}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rootClass}>
        {body}
      </a>
    );
  }
  return <article className={rootClass}>{body}</article>;
}
