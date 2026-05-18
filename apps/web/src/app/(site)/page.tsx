import { HomeHeroCarousel, type HeroSlide } from '@/components/hero/HomeHeroCarousel';
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

  // Prefer curated heroSlides[] from the home global. Fall back to the
  // legacy hero_media if no slides have been seeded yet, then to a static
  // placeholder so the page never breaks during the operator's migration.
  const seededSlides: HeroSlide[] = (home?.heroSlides ?? [])
    .map<HeroSlide>((s) => ({
      src: s.image?.url ?? '',
      alt: s.alt ?? '',
      link: s.link ?? undefined,
    }))
    .filter((s) => s.src.length > 0);

  const slides: HeroSlide[] =
    seededSlides.length > 0
      ? seededSlides
      : home?.hero_media?.url
        ? [{ src: home.hero_media.url, alt: home?.hero_heading ?? '' }]
        : [{ src: '/hero/IMG_0889.jpeg', alt: '' }];

  return (
    <>
      <HomeHeroCarousel
        heading={home?.hero_heading ?? undefined}
        subheading={home?.hero_subheading ?? undefined}
        slides={slides}
      />
      <HomeBrandStatement statement={home?.brand_statement ?? null} />
      <HomeFeaturedDesigns designs={home?.featured_designs ?? []} />
      <HomeShowroomsStrip showrooms={showrooms} />
      <HomeJournalTeaser articles={articles} />
      <HomeInquiryCta heading={home?.inquiry_cta_heading ?? undefined} />
    </>
  );
}
