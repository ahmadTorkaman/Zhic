import Link from 'next/link';
import { BlurInText, ParallaxImage } from '@zhic/ui';
import './home-rooms-tiles.css';

export type HomeRoomTile = {
  slug: 'kid' | 'teen' | 'adult';
  name: string;
  tagline?: string;
  coverUrl: string;
};

export type HomeRoomsTilesProps = {
  rooms: HomeRoomTile[];
};

// Room slug → /bedroom-set/{occupancy} hub. The /rooms/[slug] route still
// exists as an editorial landing, but the homepage tiles should drive into
// the catalog occupancy pages.
const ROOM_TO_OCCUPANCY: Record<'kid' | 'teen' | 'adult', 'baby' | 'teen' | 'double'> = {
  kid:   'baby',
  teen:  'teen',
  adult: 'double',
};

export function HomeRoomsTiles({ rooms }: HomeRoomsTilesProps) {
  if (rooms.length === 0) return null;
  return (
    <section className="zh-rooms" aria-label="دسته‌بندی سنی">
      {/* Figma Page-2: full-bleed editorial bands, image + text 50/50,
          alternating sides per band (nth-child(even) flips). */}
      <div className="zh-rooms__bands">
        {rooms.map((r) => (
          <Link key={r.slug} href={`/bedroom-set/${ROOM_TO_OCCUPANCY[r.slug]}`} className="zh-rooms__band">
            <ParallaxImage
              src={r.coverUrl}
              alt={r.name}
              /* Teen cover: the bed sits in the lower part of the photo —
                 bias the window down so it stays in frame while scrolling. */
              verticalAmount={r.slug === 'teen' ? 30 : 70}
              shiftUp={r.slug === 'teen' ? 80 : 0}
              topRightRadius={48}
              className="zh-rooms__media"
            />
            <div className="zh-rooms__text">
              <span className="zh-rooms__eyebrow-wrap">
                <span className="zh-rooms__bar" aria-hidden />
                <BlurInText as="div" className="zh-rooms__label">{r.slug === 'teen' ? 'اتاق نوجوان' : 'دسته سنی'}</BlurInText>
              </span>
              <BlurInText as="h2" className="zh-rooms__title">{r.name}</BlurInText>
              {r.tagline && <BlurInText as="p" className="zh-rooms__sub">{r.tagline}</BlurInText>}
              <span className="zh-rooms__cta">
                مشاهده
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14 6l-6 6 6 6" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
