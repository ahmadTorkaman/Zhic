import { PayloadImage } from '@/components/PayloadImage';
import { mediaUrl, type PayloadMedia } from '@/lib/payload';

export type DesignHeroProps = {
  heroMedia: PayloadMedia | null;
  name: string;
  tagline: string | null;
  eyebrow: string;
};

export function DesignHero({ heroMedia, name, tagline, eyebrow }: DesignHeroProps) {
  // The header media comes from the set's carousel slot (sliderMedia), which is
  // a GIF or short video. Animated GIFs (image/gif) animate natively in <img>;
  // true videos need a <video> tag, mirroring the carousel's mime check.
  const isVideo = heroMedia?.mimeType?.startsWith('video/') ?? false;

  return (
    <section className="flex flex-col items-center gap-8 pb-12 pt-[calc(var(--header-height)+var(--space-5))]">
      {heroMedia ? (
        <div className="w-full max-w-[720px]">
          {isVideo ? (
            <video
              src={mediaUrl(heroMedia) ?? undefined}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <PayloadImage
              media={heroMedia}
              alt={name}
              loading="eager"
              fetchPriority="high"
              fallbackText="تصویر به‌زودی"
            />
          )}
        </div>
      ) : null}

      <div className="flex max-w-[680px] flex-col items-center gap-3 px-4 text-center">
        <p className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
          {eyebrow}
        </p>
        <h1 className="text-h1 font-black text-ink">{name}</h1>
        {tagline ? (
          <p className="text-lead font-light leading-[var(--leading-lead)] text-stone">
            {tagline}
          </p>
        ) : null}
      </div>
    </section>
  );
}
