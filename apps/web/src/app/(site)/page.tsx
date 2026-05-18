import { HomeHeroCarousel, type HeroSlide } from '@/components/hero/HomeHeroCarousel';
import { HomeRoomsTiles, type HomeRoomTile } from '@/components/home/HomeRoomsTiles';
import { HomeBrandStatement } from '@/components/home/HomeBrandStatement';
import { HomeFeaturedDesigns } from '@/components/home/HomeFeaturedDesigns';
import { HomeShowroomsStrip } from '@/components/home/HomeShowroomsStrip';
import { HomeJournalRows, type HomeJournalArticle } from '@/components/home/HomeJournalRows';
import { HomeInquiryCta } from '@/components/home/HomeInquiryCta';
import { fetchHome, fetchShowrooms, fetchLatestArticles, fetchRooms } from '@/lib/payload';

export default async function HomePage() {
  const [home, showrooms, articles, rooms] = await Promise.all([
    fetchHome(),
    fetchShowrooms(3),
    fetchLatestArticles(15),
    fetchRooms(),
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

  // Map and filter rooms: only include rooms with valid slugs and covers.
  const VALID_ROOM_SLUGS = new Set<'kid' | 'teen' | 'adult'>(['kid', 'teen', 'adult']);
  const roomTiles: HomeRoomTile[] = rooms
    .filter((r): r is typeof r & { slug: 'kid' | 'teen' | 'adult' } => VALID_ROOM_SLUGS.has(r.slug as 'kid' | 'teen' | 'adult'))
    .filter((r) => !!r.cover?.url)
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      tagline: r.tagline ?? undefined,
      coverUrl: r.cover!.url!,
    }));

  // Map articles to journal row format: filter for valid covers.
  const journalArticles: HomeJournalArticle[] = articles
    .filter((a) => !!a.cover?.url)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category?.name ?? '',
      coverUrl: a.cover!.url!,
    }));

  return (
    <>
      <HomeHeroCarousel
        heading={home?.hero_heading ?? undefined}
        subheading={home?.hero_subheading ?? undefined}
        slides={slides}
      />
      <HomeRoomsTiles rooms={roomTiles} />
      <HomeBrandStatement statement={home?.brand_statement ?? null} />
      <HomeFeaturedDesigns designs={home?.featured_designs ?? []} />
      <HomeShowroomsStrip showrooms={showrooms} />
      <HomeJournalRows articles={journalArticles} />
      <HomeInquiryCta heading={home?.inquiry_cta_heading ?? undefined} />
    </>
  );
}
