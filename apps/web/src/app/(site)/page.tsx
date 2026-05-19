import { HomeHeroCarousel, type HeroSlide } from '@/components/hero/HomeHeroCarousel';
import { HomeRoomsTiles, type HomeRoomTile } from '@/components/home/HomeRoomsTiles';
import { HomeBrandStatement } from '@/components/home/HomeBrandStatement';
import { HomeJournalRows, type HomeJournalArticle } from '@/components/home/HomeJournalRows';
import { HomeShowroomsTeaser, type HomeShowroomCard } from '@/components/home/HomeShowroomsTeaser';
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

  // Static fallback media (interior shots from Plan A's brainstorm mockup).
  // Used until the operator seeds real images in /admin. When real data is
  // present, the fallbacks aren't touched.
  const FALLBACK_HERO_SLIDES: HeroSlide[] = [
    { src: '/docs/test-media/hero-1.jpg', alt: 'فضای کاری ژیک' },
    { src: '/docs/test-media/hero-2.jpg', alt: 'سرویس خواب گردو' },
    { src: '/docs/test-media/hero-3.jpg', alt: 'جزئیات حکاکی' },
    { src: '/docs/test-media/hero-4.jpg', alt: 'بافت چوب گردو' },
    { src: '/docs/test-media/hero-5.jpg', alt: 'صحنه‌ی اتاق خواب' },
  ];
  const FALLBACK_ROOM_COVERS: Record<'kid' | 'teen' | 'adult', string> = {
    kid: '/docs/test-media/kid.jpg',
    teen: '/docs/test-media/teen.jpg',
    adult: '/docs/test-media/adult.jpg',
  };
  const FALLBACK_SHOWROOM_COVERS = [
    '/docs/test-media/hero-1.jpg',
    '/docs/test-media/hero-2.jpg',
    '/docs/test-media/hero-3.jpg',
  ];
  const FALLBACK_JOURNAL_COVERS = [
    '/docs/test-media/hero-3.jpg',
    '/docs/test-media/hero-4.jpg',
    '/docs/test-media/hero-5.jpg',
    '/docs/test-media/hero-1.jpg',
    '/docs/test-media/hero-2.jpg',
  ];

  const slides: HeroSlide[] =
    seededSlides.length > 0
      ? seededSlides
      : home?.hero_media?.url
        ? [{ src: home.hero_media.url, alt: home?.hero_heading ?? '' }]
        : FALLBACK_HERO_SLIDES;

  // Map and filter rooms: only include rooms with valid slugs. Use the room's
  // own cover when set; otherwise fall back to a stock interior shot so the
  // section is visible before the operator uploads media.
  const VALID_ROOM_SLUGS = new Set<'kid' | 'teen' | 'adult'>(['kid', 'teen', 'adult']);
  const roomTiles: HomeRoomTile[] = rooms
    .filter((r): r is typeof r & { slug: 'kid' | 'teen' | 'adult' } => VALID_ROOM_SLUGS.has(r.slug as 'kid' | 'teen' | 'adult'))
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      tagline: r.tagline ?? undefined,
      coverUrl: r.cover?.url ?? FALLBACK_ROOM_COVERS[r.slug],
    }));

  // Map articles to journal row format. Fall back to stock covers if the
  // article has none — so the parallax rows are visible before editorial
  // content lands.
  const journalArticles: HomeJournalArticle[] = articles.map((a, i) => ({
    slug: a.slug,
    title: a.title,
    category: a.category?.name ?? '',
    coverUrl: a.cover?.url ?? FALLBACK_JOURNAL_COVERS[i % FALLBACK_JOURNAL_COVERS.length]!,
  }));

  // Build showroom cards: max 3. Fall back to stock covers if the showroom
  // has none.
  const showroomCards: HomeShowroomCard[] = showrooms.slice(0, 3).map((s, i) => ({
    slug: s.slug,
    city: s.address?.city ?? s.name,
    addressLine: [s.address?.district, s.address?.street, s.address?.plaque]
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .join('، '),
    phone: s.phone ?? undefined,
    coverUrl: s.cover?.url ?? FALLBACK_SHOWROOM_COVERS[i % FALLBACK_SHOWROOM_COVERS.length]!,
    isCentral: s.is_central ?? undefined,
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
      <HomeJournalRows articles={journalArticles} />
      <HomeShowroomsTeaser showrooms={showroomCards} />
    </>
  );
}
