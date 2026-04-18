import type { Metadata } from 'next';
import { HomeBrandStatement } from '@/components/home/HomeBrandStatement';
import { HomeFeaturedDesigns } from '@/components/home/HomeFeaturedDesigns';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeInquiryCta } from '@/components/home/HomeInquiryCta';
import { HomeJournalTeaser } from '@/components/home/HomeJournalTeaser';
import { HomeShowroomsStrip } from '@/components/home/HomeShowroomsStrip';
import {
  fetchHome,
  fetchLatestArticles,
  fetchShowrooms,
} from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonld';
import { plainTextFromRichText } from '@/lib/richtext';

const FALLBACK_DESCRIPTION =
  'ژیک — مبلمان دست‌ساز از همدان. چوب گردو، کتان بلژیکی، و ساختی که می‌ماند.';

export async function generateMetadata(): Promise<Metadata> {
  const home = await fetchHome();
  const heading = home?.hero_heading ?? 'ساخته‌شده برای ماندن';
  const description =
    plainTextFromRichText(home?.brand_statement ?? null) ??
    FALLBACK_DESCRIPTION;
  return {
    title: { absolute: `ژیک — ${heading}` },
    description,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      title: `ژیک — ${heading}`,
      description,
    },
  };
}

export default async function Home() {
  const [home, showrooms, articles] = await Promise.all([
    fetchHome(),
    fetchShowrooms(4),
    fetchLatestArticles(3),
  ]);

  return (
    <>
      <HomeHero
        heading={home?.hero_heading ?? null}
        subheading={home?.hero_subheading ?? null}
        media={home?.hero_media ?? null}
      />
      <HomeBrandStatement body={home?.brand_statement ?? null} />
      <HomeFeaturedDesigns designs={home?.featured_designs ?? []} />
      <HomeShowroomsStrip showrooms={showrooms} />
      <HomeJournalTeaser
        articles={articles}
        heading={home?.journal_teaser_heading ?? null}
      />
      <HomeInquiryCta heading={home?.inquiry_cta_heading ?? null} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd({
            name: 'ژیک',
            url: SITE_URL,
            description: 'مبلمان دست‌ساز ایرانی از همدان',
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd({ name: 'ژیک', url: SITE_URL })),
        }}
      />
    </>
  );
}
