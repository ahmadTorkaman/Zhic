import type { ReactNode } from 'react';
import { Aspect, Badge, MoneyDisplay, type AspectRatio } from '@zhic/ui';

type TitleSize = 'body' | 'h4' | 'h3';
type Hover = 'full' | 'soft';

export type TileProps = {
  href: string;
  image: ReactNode;
  aspect: AspectRatio;
  /** Optional eyebrow above the title (e.g. category). Renders in forest, tracking-eyebrow. */
  eyebrow?: ReactNode;
  title: ReactNode;
  titleSize?: TitleSize;
  /** Below-title meta line (e.g. "چوب گردو · دست‌ساز" or "۷ دقیقه مطالعه"). */
  meta?: ReactNode;
  /** Rials. Renders LTR via MoneyDisplay. */
  price?: number | bigint;
  /** Optional badge in top-start corner of the image. */
  badge?: ReactNode;
  /** "full" = lift -3px + bg/border/shadow swap on parent + scale-1.02 on inner image (product tiles).
   *  "soft" = lift -3px + scale-1.02 only (article tiles). */
  hover?: Hover;
  className?: string;
  /** Extra classes forwarded to the inner <Aspect> — use for responsive aspect overrides
   *  like `sm:aspect-[16/9] md:aspect-[3/4]`. Applied after the base ratio class so
   *  breakpoint-prefixed utilities win. */
  aspectClassName?: string;
};

const TITLE_SIZE_CLASS: Record<TitleSize, string> = {
  body: 'text-body font-bold text-charcoal',
  h4:   'text-h4 font-bold text-charcoal',
  h3:   'text-h3 font-bold text-charcoal',
};

export function Tile({
  href, image, aspect,
  eyebrow, title, titleSize = 'body', meta, price, badge,
  hover = 'soft', className = '', aspectClassName = '',
}: TileProps) {
  const wrapperBg = hover === 'full'
    ? 'border border-transparent bg-cream group-hover:border-sand group-hover:bg-ivory group-hover:shadow-card transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]'
    : 'bg-cream';

  return (
    <a
      href={href}
      className={`group block transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-[3px] ${className}`}
    >
      <Aspect ratio={aspect} className={`mb-4 ${wrapperBg} ${aspectClassName}`}>
        <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          {image}
        </div>
        {badge ? (
          <span className="absolute start-4 top-4">
            <Badge variant="status">{badge}</Badge>
          </span>
        ) : null}
      </Aspect>
      {eyebrow ? (
        <div className="mb-2 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest">
          {eyebrow}
        </div>
      ) : null}
      <div className={`mb-1 ${TITLE_SIZE_CLASS[titleSize]}`}>{title}</div>
      {meta ? <div className="text-small font-light text-stone">{meta}</div> : null}
      {typeof price === 'number' || typeof price === 'bigint' ? (
        <div className="mt-1 text-small font-light text-stone">
          <MoneyDisplay rials={price} />
        </div>
      ) : null}
    </a>
  );
}
