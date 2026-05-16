import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadMedia } from '@/lib/payload';

export type DesignMoodboardProps = {
  images: PayloadMedia[];
};

export function DesignMoodboard({ images }: DesignMoodboardProps) {
  // Single-image gallery looks like a forgotten upload; require ≥ 2 for the section to feel intentional.
  if (images.length < 2) return null;

  return (
    <section
      aria-label="moodboard"
      className="mx-auto w-full max-w-[var(--container-storefront)] px-4 pb-12 lg:px-6"
    >
      <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">
        {images.map((img) => (
          <li key={img.id} className="overflow-hidden rounded-md">
            <PayloadImage
              media={img}
              alt={img.alt ?? ''}
              fallbackText="تصویر"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
