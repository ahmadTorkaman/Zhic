import { mediaUrl } from '@/lib/payload';
import type { PayloadMedia } from '@/lib/payload';

type Props = {
  gallery: PayloadMedia[] | null | undefined;
};

function isStill(m: PayloadMedia): boolean {
  return !m.mimeType || !/^(image\/gif|video\/)/i.test(m.mimeType);
}

export function ProductHeroImage({ gallery }: Props) {
  const stills = (gallery ?? []).filter(isStill);
  const first = stills[0];
  const src = mediaUrl(first ?? null);
  const alt = first?.alt ?? '';

  return (
    <div className="relative mb-7 aspect-[21/9] overflow-hidden bg-cream">
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-body text-stone">
          تصاویر این محصول به‌زودی منتشر می‌شود
        </div>
      )}
      {/* Bottom gradient fade to ivory */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            'linear-gradient(to top, var(--color-ivory) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

export function ProductThumbnails({ gallery }: Props) {
  const stills = (gallery ?? []).filter(isStill);
  if (stills.length <= 1) return null;
  return (
    <div className="mb-7 flex gap-3 overflow-x-auto md:overflow-visible">
      {stills.slice(0, 5).map((m, idx) => {
        const src = mediaUrl(m);
        if (!src) return null;
        return (
          <div
            key={m.id}
            className={`flex-shrink-0 cursor-default border-2 bg-cream transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] ${
              idx === 0 ? 'border-charcoal' : 'border-transparent hover:border-sand'
            }`}
            style={{ width: 80, height: 80 }}
          >
            <img
              src={src}
              alt={m.alt ?? ''}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
