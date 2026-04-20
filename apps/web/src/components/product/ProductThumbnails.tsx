import { toPersianDigits } from '@zhic/locale';
import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadMedia } from '@/lib/payload';

export type ProductThumbnailsProps = {
  images: PayloadMedia[];
  activeIndex?: number; // default 0
};

export function ProductThumbnails({ images, activeIndex = 0 }: ProductThumbnailsProps) {
  if (images.length === 0) return null;

  return (
    /* c-thumbs: flex gap-3 mb-7 overflow-x-auto; each thumb 80x80 */
    <div className="mb-7 flex gap-3 overflow-x-auto [scrollbar-width:none]">
      {images.map((m, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={m.id ?? i}
            type="button"
            aria-label={`تصویر ${toPersianDigits(i + 1)}`}
            aria-current={isActive ? 'true' : undefined}
            className={[
              'h-20 w-20 shrink-0 bg-cream overflow-hidden border-2',
              'transition-[border-color] duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
              isActive
                ? 'border-charcoal'
                : 'border-transparent hover:border-sand',
            ].join(' ')}
          >
            <div className="relative h-full w-full">
              <PayloadImage media={m} alt="" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
