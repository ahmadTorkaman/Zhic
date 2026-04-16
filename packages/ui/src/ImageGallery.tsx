'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toPersianDigits } from '@zhic/locale';
import { Aspect, type AspectRatio } from './Aspect';
import { Badge } from './Badge';
import { cn } from './cn';
import { Modal } from './Modal';

export type GalleryItem = {
  src: string;
  alt: string;
  kind?: 'image' | 'gif';
  width?: number;
  height?: number;
  caption?: ReactNode;
};

export type ImageGalleryProps = {
  items: GalleryItem[];
  layout?: 'grid' | 'strip';
  columns?: 2 | 3 | 4;
  cellRatio?: AspectRatio;
  lightbox?: boolean;
  className?: string;
};

const GRID_COLUMNS: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2 md:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

const STRIP_MIN_W = 'min-w-[240px] md:min-w-[320px]';

export function ImageGallery({
  items,
  layout = 'grid',
  columns = 3,
  cellRatio = '4/5',
  lightbox = true,
  className,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const open = activeIndex !== null;
  const total = items.length;

  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback(() => {
    setActiveIndex((i) => (i === null ? i : (i + 1) % total));
  }, [total]);
  const prev = useCallback(() => {
    setActiveIndex((i) => (i === null ? i : (i - 1 + total) % total));
  }, [total]);

  useEffect(() => {
    if (!open) return;
    // Under RTL (site-wide guarantee), ArrowLeft advances in reading direction
    // (next) and ArrowRight retreats (prev). Flip if dir is LTR.
    const isRtl =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('dir') !== 'ltr';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        (isRtl ? next : prev)();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        (isRtl ? prev : next)();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, next, prev]);

  const containerClass =
    layout === 'grid'
      ? cn('grid gap-4', GRID_COLUMNS[columns])
      : 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2';

  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <div className={cn(containerClass, className)}>
        {items.map((item, idx) => (
          <Thumbnail
            key={idx}
            item={item}
            ratio={cellRatio}
            extra={layout === 'strip' ? `${STRIP_MIN_W} snap-start` : null}
            onClick={lightbox ? () => setActiveIndex(idx) : undefined}
          />
        ))}
      </div>

      {lightbox ? (
        <Modal
          open={open}
          onClose={close}
          size="lg"
          className="w-full max-w-[min(95vw,1200px)]"
          closeLabel="بستن"
        >
          {active ? (
            <div className="relative">
              <img
                src={active.src}
                alt={active.alt}
                className="mx-auto block max-h-[70vh] w-auto object-contain"
                width={active.width}
                height={active.height}
              />
              {active.caption ? (
                <p className="mt-3 text-center text-small text-stone">
                  {active.caption}
                </p>
              ) : null}
              <div className="pointer-events-none absolute start-0 top-0">
                <span
                  aria-live="polite"
                  className="inline-flex items-center gap-1 rounded-pill bg-ink/70 px-3 py-1 text-small text-ivory"
                >
                  <span className="tabular-nums">
                    {toPersianDigits(activeIndex! + 1)}
                  </span>
                  <span>از</span>
                  <span className="tabular-nums">{toPersianDigits(total)}</span>
                </span>
              </div>
              {total > 1 ? (
                <>
                  <LightboxNavButton
                    side="start"
                    ariaLabel="تصویر قبلی"
                    onClick={prev}
                  />
                  <LightboxNavButton
                    side="end"
                    ariaLabel="تصویر بعدی"
                    onClick={next}
                  />
                </>
              ) : null}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

function Thumbnail({
  item,
  ratio,
  extra,
  onClick,
}: {
  item: GalleryItem;
  ratio: AspectRatio;
  extra?: string | null;
  onClick?: () => void;
}) {
  const isGif = item.kind === 'gif';
  const content = (
    <>
      <Aspect ratio={ratio} className="bg-cream">
        <img
          src={item.src}
          alt={item.alt}
          loading="lazy"
          width={item.width}
          height={item.height}
          className="h-full w-full object-cover transition-transform [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out-soft)] motion-safe:group-hover:scale-[1.02]"
        />
      </Aspect>
      {isGif ? (
        <div className="absolute end-2 top-2">
          <Badge variant="neutral" size="sm" shape="rounded">
            GIF
          </Badge>
        </div>
      ) : null}
    </>
  );

  const rootClass = cn(
    'group relative block overflow-hidden rounded-md border border-sand bg-ivory',
    'transition-colors [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out-soft)]',
    onClick
      ? 'cursor-zoom-in hover:border-charcoal focus-visible:outline-none'
      : null,
    extra,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={rootClass}
        aria-label={item.alt}
      >
        {content}
      </button>
    );
  }
  return (
    <figure className={rootClass}>
      {content}
      {item.caption ? (
        <figcaption className="sr-only">{item.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function LightboxNavButton({
  side,
  ariaLabel,
  onClick,
}: {
  side: 'start' | 'end';
  ariaLabel: string;
  onClick: () => void;
}) {
  const position =
    side === 'start'
      ? 'start-2 md:start-4'
      : 'end-2 md:end-4';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-pill bg-ink/70 text-ivory hover:bg-ink focus-ring-invert focus-visible:outline-none',
        position,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
        className={side === 'start' ? 'rtl:-scale-x-100' : '-scale-x-100 rtl:scale-x-100'}
      >
        <path
          d="M10 3 L5 8 L10 13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
