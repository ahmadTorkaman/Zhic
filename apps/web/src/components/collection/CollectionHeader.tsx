import type { PayloadCollection } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';
import { RichText } from '@/lib/richtext';
import { Container } from '@zhic/ui';

type Props = {
  collection: PayloadCollection;
};

export function CollectionHeader({ collection }: Props) {
  const coverSrc = mediaUrl(collection.cover ?? null);
  return (
    <>
      {/* Full-bleed hero with bottom gradient overlay (matches A4-B / D3 article hero pattern) */}
      <div className="relative mb-8">
        <div className="relative min-h-[35vh] overflow-hidden bg-cream">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={collection.cover?.alt ?? collection.name}
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-body text-stone">
              تصویر این مجموعه به‌زودی منتشر می‌شود
            </div>
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(to top, var(--color-ivory) 0%, transparent 50%)',
            }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 pb-7">
          <Container>
            <div className="mb-2 text-eyebrow font-bold uppercase tracking-[0.1em] text-forest">
              مجموعه
            </div>
            <h1 className="text-h1 font-black text-ink text-balance">
              {collection.name}
            </h1>
          </Container>
        </div>
      </div>

      {/* Editorial intro */}
      {collection.description ? (
        <Container>
          <div className="mb-8 max-w-[560px] text-lead font-light text-stone">
            <RichText value={collection.description} />
          </div>
        </Container>
      ) : null}
    </>
  );
}
