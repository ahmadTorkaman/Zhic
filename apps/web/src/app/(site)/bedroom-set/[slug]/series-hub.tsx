import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@zhic/ui';
import { DesignHero } from '@/components/design/DesignHero';
import { DesignStory } from '@/components/design/DesignStory';
import { DesignMoodboard } from '@/components/design/DesignMoodboard';
import { ProductGrid } from '@/components/product/ProductGrid';
import { fetchDesign, fetchProducts } from '@/lib/payload';
import { OCCUPANCY_SLUGS, OCCUPANCY_PERSIAN, type OccupancySlug } from './occupancy';

/** Series-hub metadata. The canonical ALWAYS points at the bare series URL —
 *  the /bedroom-set/[age]/[series] views are unpromoted facets (conservative
 *  default per the SEO playbook's facet-page promotion rule), so they
 *  canonicalize to the parent instead of indexing themselves. */
export async function seriesHubMetadata(slug: string): Promise<Metadata> {
  const design = await fetchDesign(slug);
  if (!design) return { title: 'یافت نشد' };
  return {
    title: design.name,
    description: design.tagline ?? `طرح ${design.name} — مبلمان دست‌ساز ژیک`,
    alternates: { canonical: `/bedroom-set/${design.slug}` },
    openGraph: {
      title: design.name,
      description: design.tagline ?? undefined,
      images: design.heroMedia?.url ? [{ url: design.heroMedia.url }] : undefined,
    },
  };
}

export type SeriesHubProps = {
  slug: string;
  /** Occupancy the visitor arrived through (first path segment on
   *  /bedroom-set/[age]/[series]). Occupancy is a DESIGN-level property
   *  (every product in a design serves all the design's age groups), so
   *  products are NOT filtered by age — `ageFilter` only emphasizes the
   *  matching badge. */
  ageFilter?: OccupancySlug;
};

export async function SeriesHub({ slug, ageFilter }: SeriesHubProps) {
  const [design, productsPage] = await Promise.all([
    fetchDesign(slug),
    fetchProducts({ design: slug, page: 1 }),
  ]);

  if (!design) {
    notFound();
  }

  // Each set's carousel image (sliderMedia, the bedroom-set-<slug>.webp) is the
  // per-set picture; use it as the detail-page hero when no explicit heroMedia
  // is set, so the page matches its carousel slide. Operator can still override
  // by uploading a dedicated heroMedia.
  const heroMedia = design.heroMedia ?? design.sliderMedia ?? design.gallery?.[0] ?? null;
  const moodboardImages = design.gallery ?? [];

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: 'سرویس خواب', href: '/bedroom-set' },
              { label: design.name },
            ]}
          />
        </div>
      </Container>

      <DesignHero
        heroMedia={heroMedia}
        name={design.name}
        tagline={design.tagline ?? null}
        eyebrow="طرح"
      />

      <DesignStory blocks={design.storyBlocks ?? null} />

      <DesignMoodboard images={moodboardImages} />

      <Container>
        <section aria-label="مجموعه" className="pb-16">
          <p className="mb-5 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
            مجموعه
          </p>
          {/* Read-only age badges: occupancy is design-level, so these show
              which age groups the design serves rather than filtering the set.
              The badge the visitor arrived through (/[age]) is emphasized. */}
          {design.occupancies && design.occupancies.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="me-2 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-stone">
                گروه سنی:
              </span>
              {OCCUPANCY_SLUGS.filter((o) => design.occupancies!.includes(o)).map((o) => {
                const emphasized = ageFilter === o;
                const base = 'inline-flex rounded-full px-4 py-1.5 text-small';
                return (
                  <span
                    key={o}
                    className={
                      emphasized
                        ? `${base} bg-forest-dark font-bold text-ivory`
                        : `${base} border border-sand font-medium text-charcoal`
                    }
                  >
                    {OCCUPANCY_PERSIAN[o].title.replace('سرویس خواب ', '')}
                  </span>
                );
              })}
            </div>
          ) : null}
          {productsPage.docs.length === 0 ? (
            <p className="py-9 text-center text-stone">
              به‌زودی محصولات این طرح اضافه می‌شود.
            </p>
          ) : (
            <ProductGrid products={productsPage.docs} />
          )}
        </section>
      </Container>
    </>
  );
}
