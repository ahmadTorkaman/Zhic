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

  // Static fallback media — six-slide mix of full-room scenes + craft detail
  // close-ups across the Jacqueline, Iron, Lotus, Shaylin, Celine, and Baloot
  // series. Used until the operator seeds heroSlides[] on the home global.
  // Sources live in /imports/ZhicProducts_webp/{series}/{room,detail-picture}*.webp
  // and were resized to 1920px max-edge WebP at 88% quality.
  const FALLBACK_HERO_SLIDES: HeroSlide[] = [
    { src: '/hero-details/jacqueline.webp', alt: 'اتاق خواب کلاسیک با چوب سفید — ژاکلین' },
    { src: '/hero-details/shaylin.webp',    alt: 'حکاکی دستی روی قاب آینه — شیلین' },
    { src: '/hero-details/iron.webp',       alt: 'اتاق نوجوان مدرن با دیوار بتنی — آیرون' },
    { src: '/hero-details/loof.webp',       alt: 'اتاق آرام با چوب طبیعی و سبز خزه‌ای — لوف' },
    { src: '/hero-details/celine.webp',     alt: 'گل منبت‌شده روی چوب گردو — سلین' },
    { src: '/hero-details/bw.webp',         alt: 'اتاق با دیوار آجری مشکی — بی‌دبلیو' },
    { src: '/hero-details/lotus.webp',      alt: 'اتاق با چوب بلوط و دیوار تیره — لوتوس' },
    { src: '/hero-details/lukaplus.webp',   alt: 'اتاق نوجوان با خط افق شهر — لوکا پلاس' },
    { src: '/hero-details/baloot.webp',     alt: 'تختخواب نوزاد چوب طبیعی — بلوط' },
  ];
  const FALLBACK_ROOM_COVERS: Record<'kid' | 'teen' | 'adult', string> = {
    kid: '/docs/test-media/kid.jpg',
    teen: '/docs/test-media/teen.jpg',
    adult: '/docs/test-media/adult.jpg',
  };
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

  // Build showroom cards: max 3. No cover → null, so the teaser renders its
  // on-brand gradient placeholder instead of a stock photo.
  const showroomCards: HomeShowroomCard[] = showrooms.slice(0, 3).map((s) => ({
    slug: s.slug,
    city: s.address?.city ?? s.name,
    addressLine: [s.address?.district, s.address?.street, s.address?.plaque]
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .join('، '),
    phone: s.phone ?? undefined,
    coverUrl: s.cover?.url ?? null,
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
