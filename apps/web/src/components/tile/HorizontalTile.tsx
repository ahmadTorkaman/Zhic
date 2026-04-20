import type { ReactNode } from 'react';
import { MoneyDisplay } from '@zhic/ui';

export type HorizontalTileProps = {
  href: string;
  image: ReactNode;
  /** Image column width in pixels (mockups use 100, 120, or 160). */
  imageWidth: 100 | 120 | 160;
  eyebrow?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  price?: number | bigint;
  className?: string;
};

const COLS_CLASS: Record<HorizontalTileProps['imageWidth'], string> = {
  100: 'grid-cols-[100px_1fr]',
  120: 'grid-cols-[120px_1fr]',
  160: 'grid-cols-[160px_1fr]',
};

export function HorizontalTile({
  href, image, imageWidth,
  eyebrow, title, meta, price,
  className = '',
}: HorizontalTileProps) {
  return (
    <a
      href={href}
      className={`group grid items-center gap-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-[3px] ${COLS_CLASS[imageWidth]} ${className}`}
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          {image}
        </div>
      </div>
      <div>
        {eyebrow ? (
          <div className="mb-2 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-body font-bold text-charcoal">{title}</div>
        {meta ? <div className="mt-1 text-small font-light text-stone">{meta}</div> : null}
        {typeof price === 'number' || typeof price === 'bigint' ? (
          <div className="mt-1 text-small font-light text-stone">
            <MoneyDisplay rials={price} />
          </div>
        ) : null}
      </div>
    </a>
  );
}
