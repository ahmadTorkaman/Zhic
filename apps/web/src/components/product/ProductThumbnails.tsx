'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { toPersianDigits } from '@zhic/locale';
import { PayloadImage } from '@/components/PayloadImage';
import { mediaUrl, type PayloadMedia } from '@/lib/payload';

export type ProductThumbnailsProps = {
  images: PayloadMedia[];
  activeIndex?: number; // default 0
};

export function ProductThumbnails({ images, activeIndex = 0 }: ProductThumbnailsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Embla carousel — RTL-aware, loops, drag/swipe enabled by default.
  // Initialized always (cheap when no slides rendered); scrollTo() syncs to
  // openIndex whenever the lightbox opens.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: 'rtl',
    loop: true,
    align: 'center',
    skipSnaps: false,
  });

  const close = useCallback(() => setOpenIndex(null), []);

  // Jump the carousel to the freshly-tapped thumbnail when the lightbox opens.
  useEffect(() => {
    if (openIndex !== null && emblaApi) {
      emblaApi.scrollTo(openIndex, true); // jump=true → no transition
      setCurrentSlide(openIndex);
    }
  }, [openIndex, emblaApi]);

  // Keep the dot/counter state in sync with swipe-driven slide changes.
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Keyboard: Esc closes, arrows navigate. RTL: ArrowRight = visually previous.
  // Lock body scroll while the lightbox is mounted.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') emblaApi?.scrollPrev();
      else if (e.key === 'ArrowLeft') emblaApi?.scrollNext();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, emblaApi]);

  if (images.length === 0) return null;

  const lightbox =
    openIndex !== null && mounted ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="نمای بزرگ تصویر"
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(20, 17, 15, 0.86)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: 'pt-lightbox-fade var(--dur-fast) ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Counter — top center */}
        {images.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(250, 250, 247, 0.6)',
              fontSize: '14px',
              letterSpacing: '0.12em',
              fontVariantNumeric: 'tabular-nums',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {toPersianDigits(currentSlide + 1)} / {toPersianDigits(images.length)}
          </div>
        )}

        {/* Close (×) — RTL inset-inline-end = visual top-left */}
        <button
          type="button"
          aria-label="بستن"
          onClick={(e) => { e.stopPropagation(); close(); }}
          style={{
            position: 'fixed',
            top: '20px',
            insetInlineEnd: '20px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(250, 250, 247, 0.12)',
            border: '1px solid rgba(250, 250, 247, 0.2)',
            borderRadius: '50%',
            color: 'rgba(250, 250, 247, 0.95)',
            cursor: 'pointer',
            fontSize: '22px',
            lineHeight: 1,
            zIndex: 2,
          }}
        >
          ×
        </button>

        {/* Embla viewport — swipeable carousel filling the modal. Clicks inside
            the viewport don't close the modal (stopPropagation); clicks on the
            dim backdrop around the slides still do (handled by the outer div). */}
        <div
          ref={emblaRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            overflow: 'hidden',
            width: '100%',
            cursor: images.length > 1 ? 'grab' : 'default',
          }}
        >
          <div style={{ display: 'flex', height: '100%' }}>
            {images.map((m, i) => (
              <div
                key={m.id ?? i}
                style={{
                  flex: '0 0 100%',
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'clamp(16px, 4vw, 56px)',
                }}
              >
                <img
                  src={mediaUrl(m) ?? ''}
                  alt={m.alt ?? ''}
                  draggable={false}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 8rem)',
                    objectFit: 'contain',
                    display: 'block',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
                    // Native browser pinch-zoom on the image element. Two-finger
                    // gesture only, so embla's single-finger drag is unaffected.
                    touchAction: 'pinch-zoom',
                    userSelect: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators — replaces the prev/next buttons */}
        {images.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
              zIndex: 2,
            }}
          >
            {images.map((_, i) => {
              const isActive = i === currentSlide;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`تصویر ${toPersianDigits(i + 1)}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => emblaApi?.scrollTo(i)}
                  style={{
                    width: isActive ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: isActive
                      ? 'rgba(250, 250, 247, 0.95)'
                      : 'rgba(250, 250, 247, 0.4)',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    transition:
                      'width var(--dur-hover) var(--ease-out-soft), background-color var(--dur-hover) var(--ease-out-soft)',
                  }}
                />
              );
            })}
          </div>
        )}

        <style>{`
          @keyframes pt-lightbox-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    ) : null;

  return (
    <>
      {/* Thumbnail row — tap any thumb to open the lightbox at that index. */}
      <div className="mb-7 flex gap-3 overflow-x-auto [scrollbar-width:none]">
        {images.map((m, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={m.id ?? i}
              type="button"
              aria-label={`تصویر ${toPersianDigits(i + 1)} — برای نمای بزرگ کلیک کنید`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => setOpenIndex(i)}
              className={[
                'h-20 w-20 shrink-0 bg-cream overflow-hidden border-2 cursor-pointer',
                'transition-[border-color,transform] duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
                'hover:-translate-y-[1px]',
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
      {mounted && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
