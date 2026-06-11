import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import { fetchDesignsByOccupancy } from '@/lib/payload';
import { OCCUPANCY_SLUGS, OCCUPANCY_PERSIAN, isOccupancySlug } from './occupancy';
import { SeriesHub, seriesHubMetadata } from './series-hub';

type PageProps = {
  params: Promise<{ slug: string }>;
  /** Legacy `?age=baby|teen|double|bunk` — the within-design occupancy
   *  filter used to travel as a query param. It now lives at
   *  /bedroom-set/[slug]/[age]; valid values are permanently redirected
   *  there, anything else is dropped silently. */
  searchParams: Promise<{ age?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  // Occupancy hub
  if (isOccupancySlug(slug)) {
    const { title, tagline } = OCCUPANCY_PERSIAN[slug];
    return {
      title,
      description: tagline,
      alternates: { canonical: `/bedroom-set/${slug}` },
      openGraph: { title, description: tagline },
    };
  }

  // Series hub
  return seriesHubMetadata(slug);
}

export default async function BedroomSetSlugPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;
  const ageRaw = typeof sp.age === 'string' ? sp.age : undefined;

  // ═══════════════════════════════════════════════════════════════════════════
  // OCCUPANCY HUB BRANCH
  // ═══════════════════════════════════════════════════════════════════════════
  if (isOccupancySlug(slug)) {
    const { title, tagline, eyebrow } = OCCUPANCY_PERSIAN[slug];
    const designs = await fetchDesignsByOccupancy(slug);

    const otherOccupancies = OCCUPANCY_SLUGS.filter((o) => o !== slug);

    return (
      <>
        <Container>
          <div className="pt-[calc(var(--header-height)+var(--space-5))]">
            <Breadcrumbs
              items={[
                { label: 'خانه', href: '/' },
                { label: 'سرویس خواب', href: '/bedroom-set' },
                { label: title.replace('سرویس خواب ', '') },
              ]}
            />
          </div>
        </Container>

        {/* Hero — softer/warmer than the catalog pages (per v1 mockup). */}
        <section
          aria-labelledby="occupancy-title"
          className="relative mt-6 overflow-hidden border-block-end border-sand"
          style={{ background: 'var(--color-cream)' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 25% 35%, #f5ebe0 0%, #e8d8c8 55%, #d4bea8 100%)',
              opacity: 0.65,
            }}
          />
          <Container>
            <div className="relative py-16 sm:py-20">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest-deep">
                {eyebrow}
              </span>
              <h1
                id="occupancy-title"
                className="mt-3 text-h2 font-black leading-tight text-ink"
                style={{ letterSpacing: '-0.03em' }}
              >
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-body italic text-charcoal">{tagline}</p>
              <div className="mt-7 flex flex-wrap gap-9 border-block-start border-sand pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black leading-none text-ink">
                    {toPersianDigits(designs.length)}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-stone">
                    طرح
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Series grid */}
        <Container>
          <section aria-label="طرح‌ها" className="py-14">
            {designs.length === 0 ? (
              <p className="py-12 text-center text-stone">
                هنوز طرحی برای این گروه ثبت نشده.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7">
                {designs.map((d) => {
                  // Fallback chain mirrors the detail-page hero (heroMedia ??
                  // sliderMedia ?? gallery[0]). sliderMedia is the carousel
                  // slot used by /bedroom-set; for most designs it's the only
                  // populated media field, and it can be a GIF or video.
                  const cover = d.heroMedia ?? d.sliderMedia ?? d.gallery?.[0] ?? null;
                  const isVideo = cover?.mimeType?.startsWith('video/') ?? false;
                  return (
                    <a
                      key={d.id}
                      /* Age-first nested URL (IA spec) keeps the hub's age
                         context on the series page. */
                      href={`/bedroom-set/${slug}/${d.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-[5/6] overflow-hidden rounded bg-cream transition-transform duration-700 hover:-translate-y-1">
                        {cover?.url ? (
                          <>
                            {isVideo ? (
                              <video
                                src={cover.url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                aria-hidden
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={cover.url}
                                alt=""
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            )}
                            {/* Dark scrim from middle to bottom so the design
                                name (rendered below the card) reads against
                                bright media. */}
                            <div
                              aria-hidden
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(20,17,15,0.55) 100%)',
                              }}
                            />
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center text-[12px] uppercase tracking-[0.18em] text-stone">
                            به‌زودی
                          </div>
                        )}
                      </div>
                      <div className="mt-5 flex items-baseline justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone">
                            طرح
                          </span>
                          <span
                            className="text-[22px] font-black leading-tight text-ink"
                            style={{ letterSpacing: '-0.02em' }}
                          >
                            {d.name}
                          </span>
                          {d.tagline && (
                            <span className="text-[13px] text-stone">{d.tagline}</span>
                          )}
                        </div>
                        <span
                          aria-hidden="true"
                          className="text-[13px] text-sand-2 transition-colors group-hover:text-forest"
                        >
                          ←
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {/* Other occupancies strip */}
          <section aria-label="دیگر گروه‌ها" className="border-block-start border-sand py-12">
            <header className="mb-7 flex items-baseline gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                ★ دیگر گروه‌ها
              </span>
              <h2 className="text-h4 font-black text-ink">سرویس‌های دیگر</h2>
              <span className="ms-auto">
                <a href="/bedroom-set" className="text-[13px] text-stone underline underline-offset-4 hover:text-forest">
                  همه‌ی طرح‌ها ←
                </a>
              </span>
            </header>
            <div className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-3">
              {otherOccupancies.map((o) => {
                const { title: oTitle, eyebrow: oEyebrow } = OCCUPANCY_PERSIAN[o];
                return (
                  <a
                    key={o}
                    href={`/bedroom-set/${o}`}
                    className="group block rounded border border-sand p-7 transition-all hover:-translate-y-0.5 hover:border-forest hover:bg-white"
                    style={{ background: 'var(--color-cream)' }}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                      {oEyebrow}
                    </span>
                    <div className="mt-3 text-2xl font-black leading-tight text-ink" style={{ letterSpacing: '-0.02em' }}>
                      {oTitle.replace('سرویس خواب ', '')}
                    </div>
                    <span className="mt-5 inline-block border-block-end border-sand-2 pb-0.5 text-[13px] text-charcoal transition-colors group-hover:border-forest group-hover:text-forest">
                      مشاهده ←
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        </Container>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIES HUB BRANCH
  // ═══════════════════════════════════════════════════════════════════════════
  // Legacy ?age= URLs move permanently to the age-first nested path so old
  // links and history keep working.
  if (ageRaw && isOccupancySlug(ageRaw)) {
    permanentRedirect(`/bedroom-set/${ageRaw}/${encodeURIComponent(slug)}`);
  }

  return <SeriesHub slug={slug} />;
}
