import type { PayloadShowroom } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';

type Props = {
  showroom: PayloadShowroom;
};

export function ShowroomHero({ showroom }: Props) {
  const cover = mediaUrl(showroom.cover ?? showroom.gallery?.[0] ?? null);
  const visit = `/contact?showroom=${encodeURIComponent(showroom.slug)}&reason=visit`;
  return (
    <section className="relative mb-9 flex min-h-[55vh] items-center justify-center overflow-hidden bg-cream">
      {cover ? (
        <img
          src={cover}
          alt={showroom.cover?.alt ?? showroom.gallery?.[0]?.alt ?? showroom.name}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {/* Dark scrim for legibility over photo */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-ink/30" />

      {/* Centered glass overlay card */}
      <div className="glass-card relative z-10 mx-4 max-w-[520px] rounded-lg p-8 text-center shadow-card">
        {showroom.address?.city ? (
          <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.12em] text-forest">
            {showroom.address.city}
          </div>
        ) : null}
        <h1 className="mb-3 text-h2 font-black text-ink text-balance">
          {showroom.name}
        </h1>
        {showroom.headline ? (
          <p className="mb-5 text-body font-light text-stone">
            {showroom.headline}
          </p>
        ) : null}
        <a
          href={visit}
          className="inline-flex items-center justify-center rounded-md bg-forest px-9 py-4 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:shadow-elevated"
        >
          رزرو بازدید
        </a>
      </div>
    </section>
  );
}
