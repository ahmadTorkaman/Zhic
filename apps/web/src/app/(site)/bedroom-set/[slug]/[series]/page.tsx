import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isOccupancySlug, type OccupancySlug } from '../occupancy';
import { SeriesHub, seriesOccupancyMetadata } from '../series-hub';

/** /bedroom-set/[occupancy]/[series] — the canonical detail page. Age-FIRST per
 *  the IA spec (e.g. /bedroom-set/teen/iron). */
type PageProps = { params: Promise<{ slug: string; series: string }> };

function parse(rawSlug: string, rawSeries: string) {
  const occupancy = decodeURIComponent(rawSlug);
  const series = decodeURIComponent(rawSeries);
  if (isOccupancySlug(occupancy) && !isOccupancySlug(series)) {
    return { occupancy: occupancy as OccupancySlug, series } as const;
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, series } = await params;
  const parsed = parse(slug, series);
  if (!parsed) return { title: 'یافت نشد' };
  return seriesOccupancyMetadata(parsed.occupancy, parsed.series);
}

export default async function BedroomSetOccupancySeriesPage({ params }: PageProps) {
  const { slug, series } = await params;
  const parsed = parse(slug, series);

  if (!parsed) {
    // Legacy series-first shape (/bedroom-set/iron/teen) → flip to age-first.
    const a = decodeURIComponent(slug);
    const b = decodeURIComponent(series);
    if (!isOccupancySlug(a) && isOccupancySlug(b)) {
      permanentRedirect(`/bedroom-set/${b}/${encodeURIComponent(a)}`);
    }
    notFound();
  }

  return <SeriesHub occupancy={parsed.occupancy} series={parsed.series} />;
}
