import { permanentRedirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { OCCUPANCY_PERSIAN, isOccupancySlug } from './occupancy';
import { buildMosaicRows } from '@/lib/bedroom-furniture-mosaic';
import { getOccupancyHubContent } from '@/lib/occupancy-hub-content';
import { fetchDesign, bareSeriesRedirectTarget } from '@/lib/payload';
import { BedroomHero } from '@/components/bedroom-furniture/BedroomHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { MosaicStrip } from '@/components/bedroom-furniture-mosaic/MosaicStrip';

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

  // Occupancy hub — title/description from the CMS (bedroom-set global →
  // occupancyHubs SEO fields), falling back to the hardcoded copy.
  if (isOccupancySlug(slug)) {
    const hub = await getOccupancyHubContent(slug);
    const title = hub.seo.title || OCCUPANCY_PERSIAN[slug].title;
    const description = hub.seo.description;
    return {
      title,
      description,
      alternates: { canonical: `/bedroom-set/${slug}` },
      openGraph: { title, description },
    };
  }

  // Bare series URL is removed (page redirects); metadata is moot.
  return { title: 'سرویس خواب', robots: { index: false, follow: true } };
}

export default async function BedroomSetSlugPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;
  const ageRaw = typeof sp.age === 'string' ? sp.age : undefined;

  // ═══════════════════════════════════════════════════════════════════════════
  // OCCUPANCY HUB BRANCH — mosaic template (mirrors /bedroom-furniture), each
  // design a tile linking to /bedroom-set/[occupancy]/[design]. Content +
  // static-cover/ordering rules live in getOccupancyHubContent.
  // ═══════════════════════════════════════════════════════════════════════════
  if (isOccupancySlug(slug)) {
    const hub = await getOccupancyHubContent(slug);

    return (
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <div className="px-4 pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: 'سرویس خواب', href: '/bedroom-set' },
              { label: hub.shortName },
            ]}
          />
        </div>
        <div className="mt-4">
          <BedroomHero hero={hub.hero} />
        </div>
        <div className="mt-[34px]" id="hub-designs">
          <CategoryMosaic heading={hub.heading} rows={buildMosaicRows(hub.tiles)} />
        </div>
        {hub.others.length > 0 && (
          <div className="mt-[40px]">
            <MosaicStrip heading="گروه‌های دیگر" items={hub.others} seeAll={hub.othersSeeAll} />
          </div>
        )}
        {hub.body && (
          <section className="mt-[40px] px-4 pb-[22px] text-stone" aria-label="درباره‌ی این سرویس‌ها">
            {hub.body.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="mb-3 text-[13.5px] leading-[2] last:mb-0">
                {para}
              </p>
            ))}
          </section>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIES SLUG — bare /bedroom-set/[series] page removed. Redirect age-first if
  // a legacy ?age= is present, else to the design's first occupancy combo.
  // ═══════════════════════════════════════════════════════════════════════════
  if (ageRaw && isOccupancySlug(ageRaw)) {
    permanentRedirect(`/bedroom-set/${ageRaw}/${encodeURIComponent(slug)}`);
  }
  const design = await fetchDesign(slug);
  if (!design) notFound();
  permanentRedirect(bareSeriesRedirectTarget(design));
}
