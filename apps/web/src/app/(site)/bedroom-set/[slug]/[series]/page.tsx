import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isOccupancySlug } from '../occupancy';
import { SeriesHub, seriesHubMetadata } from '../series-hub';

/** /bedroom-set/[age]/[series] — a series hub viewed through one of the 4
 *  reserved occupancy slugs, nested age-FIRST per the IA spec
 *  (zhicwood-url-list.xlsx, e.g. /bedroom-set/baby/skate). UNPROMOTED facet
 *  for now (conservative default per the SEO playbook): seriesHubMetadata
 *  canonicalizes to the bare series URL, so these views never compete with
 *  the parent in search. Promote an age view only by giving it its own
 *  canonical + sitemap entry, deliberately. */
type PageProps = {
  params: Promise<{ slug: string; series: string }>;
};

function parse(rawSlug: string, rawSeries: string) {
  const age = decodeURIComponent(rawSlug);
  const series = decodeURIComponent(rawSeries);
  // Age-first nesting: the first segment must be a reserved occupancy slug
  // and the second must NOT be one (it's a design/series slug).
  if (isOccupancySlug(age) && !isOccupancySlug(series)) return { age, series } as const;
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, series } = await params;
  const parsed = parse(slug, series);
  if (!parsed) return { title: 'یافت نشد' };
  return seriesHubMetadata(parsed.series);
}

export default async function BedroomSetAgeSeriesPage({ params }: PageProps) {
  const { slug, series } = await params;
  const parsed = parse(slug, series);

  if (!parsed) {
    // The briefly-shipped series-first shape (/bedroom-set/baloot/teen) —
    // flip it to the canonical age-first order.
    const a = decodeURIComponent(slug);
    const b = decodeURIComponent(series);
    if (!isOccupancySlug(a) && isOccupancySlug(b)) {
      permanentRedirect(`/bedroom-set/${b}/${encodeURIComponent(a)}`);
    }
    notFound();
  }

  return <SeriesHub slug={parsed.series} ageFilter={parsed.age} />;
}
