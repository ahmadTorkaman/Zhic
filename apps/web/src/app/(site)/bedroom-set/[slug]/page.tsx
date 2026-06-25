import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import { OCCUPANCY_PERSIAN, isOccupancySlug } from './occupancy';
import { SeriesHub, seriesHubMetadata } from './series-hub';
import { buildMosaicRows } from '@/lib/bedroom-furniture-mosaic';
import { getOccupancyHubContent } from '@/lib/occupancy-hub-content';
import { fetchBedroomSetHub, mediaUrl } from '@/lib/payload';
import { BedroomHero } from '@/components/bedroom-furniture/BedroomHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { MosaicStrip } from '@/components/bedroom-furniture-mosaic/MosaicStrip';
import { OccupancyIntro } from '@/components/bedroom-set/OccupancyIntro';
import { OccupancyContent } from '@/components/bedroom-set/OccupancyContent';

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

  // Occupancy hub — CMS SEO fields (bedroom-set-hubs doc) override the defaults.
  if (isOccupancySlug(slug)) {
    const fallback = OCCUPANCY_PERSIAN[slug];
    const hub = await fetchBedroomSetHub(slug);
    const title = hub?.seoTitle || hub?.heroTitle || fallback.title;
    const description = hub?.seoDescription || hub?.heroTagline || fallback.tagline;
    const ogImage = mediaUrl(hub?.seoImage ?? hub?.heroImage ?? null);
    return {
      title,
      description,
      alternates: { canonical: `/bedroom-set/${slug}` },
      openGraph: { title, description, ...(ogImage ? { images: [{ url: ogImage }] } : {}) },
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
        {hub.intro && (
          <div className="mt-[28px]">
            <OccupancyIntro heading={hub.intro.heading} body={hub.intro.body} />
          </div>
        )}
        <div className="mt-[34px]" id="hub-designs">
          <CategoryMosaic heading={hub.heading} rows={buildMosaicRows(hub.tiles)} />
        </div>
        {hub.contentBody && (
          <div className="mt-[40px]">
            <OccupancyContent value={hub.contentBody} />
          </div>
        )}
        {hub.others.length > 0 && (
          <div className="mt-[40px]">
            <MosaicStrip heading={hub.crossHeading} items={hub.others} seeAll={hub.othersSeeAll} />
          </div>
        )}
      </div>
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
