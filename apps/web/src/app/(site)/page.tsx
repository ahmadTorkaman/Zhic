import { HomeHero } from '@/components/hero/HomeHero';
import { HomeBrandStatement } from '@/components/home/HomeBrandStatement';
import { HomeFeaturedDesigns } from '@/components/home/HomeFeaturedDesigns';
import { HomeShowroomsStrip } from '@/components/home/HomeShowroomsStrip';
import { HomeJournalTeaser } from '@/components/home/HomeJournalTeaser';
import { HomeInquiryCta } from '@/components/home/HomeInquiryCta';
import { fetchHome, fetchShowrooms, fetchLatestArticles } from '@/lib/payload';

export default async function HomePage() {
  const [home, showrooms, articles] = await Promise.all([
    fetchHome(),
    fetchShowrooms(3),
    fetchLatestArticles(3),
  ]);

  return (
    <>
      <HomeHero
        eyebrow={home?.hero_heading ? undefined : undefined}
        heading={home?.hero_heading ?? undefined}
        subheading={home?.hero_subheading ?? undefined}
      />
      <HomeBrandStatement statement={home?.brand_statement ?? null} />
      <HomeFeaturedDesigns designs={home?.featured_designs ?? []} />
      <HomeShowroomsStrip showrooms={showrooms} />
      <HomeJournalTeaser articles={articles} />
      <HomeInquiryCta heading={home?.inquiry_cta_heading ?? undefined} />
    </>
  );
}
