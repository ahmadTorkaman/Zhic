import { HomeHeroCarousel, type HeroSlide } from '@/components/hero/HomeHeroCarousel';
import { HomeRoomsTiles, type HomeRoomTile } from '@/components/home/HomeRoomsTiles';
import { HomeBrandStatement } from '@/components/home/HomeBrandStatement';
import { HomeJournalRows, type HomeJournalArticle } from '@/components/home/HomeJournalRows';
import { HomeShowroomsTeaser, type HomeShowroomCard } from '@/components/home/HomeShowroomsTeaser';
import { fetchHome, fetchAllShowrooms, fetchLatestArticles, fetchRooms } from '@/lib/payload';

export default async function HomePage() {
  const [home, showrooms, articles, rooms] = await Promise.all([
    fetchHome(),
    fetchAllShowrooms(),
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
    kid: '/docs/test-media/kid.webp',
    teen: '/docs/test-media/teen.webp',
    adult: '/docs/test-media/adult.webp',
  };
  const FALLBACK_JOURNAL_COVERS = [
    '/docs/test-media/hero-3.webp',
    '/docs/test-media/hero-4.webp',
    '/docs/test-media/hero-5.webp',
    '/docs/test-media/hero-1.webp',
    '/docs/test-media/hero-2.webp',
  ];

  const slides: HeroSlide[] =
    seededSlides.length > 0
      ? seededSlides
      : home?.hero_media?.url
        ? [{ src: home.hero_media.url, alt: home?.hero_heading ?? '' }]
        : FALLBACK_HERO_SLIDES;

  // Homepage age-band copy + order from the Kaveh mobile design (frame 19:120).
  // Falls back to a stock cover per slug when the room has no uploaded media.
  // These override the site-wide room hub names («اتاق کودک» …) for the homepage
  // bands ONLY — routes, nav, and the room hub pages keep the canonical names.
  // Order matches Kaveh: دو نفره → کودک → نوجوان (adult → kid → teen).
  const BAND_ORDER = ['adult', 'kid', 'teen'] as const;
  const BAND_COPY: Record<'kid' | 'teen' | 'adult', { name: string; tagline: string }> = {
    adult: {
      name: 'سرویس خواب دو نفره',
      tagline:
        'مدل‌های سرویس خواب دو نفره‌ی هماهنگ، شامل تخت، پاتختی و میز آرایش؛ چوبی و ام‌دی‌اف، برای آرامش بلندمدت اتاق خواب شما.',
    },
    kid: {
      name: 'سرویس خواب کودک',
      tagline:
        'سرویس خواب کودک با قطعات ایمن و رنگ‌های آرام؛ طراحی‌شده تا همراه رشد کودک، از نوزادی تا کودکی بماند.',
    },
    teen: {
      name: 'سرویس خواب نوجوان',
      tagline:
        'سرویس خواب نوجوان با طراحی منعطف؛ از تخت و میز تحریر تا کتابخانه، مناسب سال‌های درس و مطالعه.',
    },
  };
  const VALID_ROOM_SLUGS = new Set<'kid' | 'teen' | 'adult'>(['kid', 'teen', 'adult']);
  const roomBySlug = new Map(
    rooms
      .filter((r): r is typeof r & { slug: 'kid' | 'teen' | 'adult' } => VALID_ROOM_SLUGS.has(r.slug as 'kid' | 'teen' | 'adult'))
      .map((r) => [r.slug, r] as const),
  );
  const roomTiles: HomeRoomTile[] = BAND_ORDER.filter((slug) => roomBySlug.has(slug)).map((slug) => ({
    slug,
    name: BAND_COPY[slug].name,
    tagline: BAND_COPY[slug].tagline,
    coverUrl: roomBySlug.get(slug)!.cover?.url ?? FALLBACK_ROOM_COVERS[slug],
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

  // Figma layout: the teaser holds EVERY showroom (collapsed to one row of 3,
  // «فهرست کامل» expands). Central showroom leads the row.
  const showroomCards: HomeShowroomCard[] = showrooms
    .map((s) => ({
      slug: s.slug,
      city: s.address?.city ?? s.name,
      coverUrl: s.cover?.url ?? null,
      isCentral: s.is_central ?? undefined,
    }))
    .sort((a, b) => Number(Boolean(b.isCentral)) - Number(Boolean(a.isCentral)));

  return (
    <>
      <HomeHeroCarousel
        heading={home?.hero_heading ?? undefined}
        subheading={home?.hero_subheading ?? undefined}
        slides={slides}
      />
      <HomeRoomsTiles rooms={roomTiles} />
      <HomeBrandStatement
        statement={home?.brand_statement ?? null}
        aboutMedia={home?.about_media ?? null}
        backgroundTexture={home?.about_background?.url ?? undefined}
      />
      <HomeJournalRows articles={journalArticles} />
      <HomeShowroomsTeaser showrooms={showroomCards} />
    </>
  );
}
