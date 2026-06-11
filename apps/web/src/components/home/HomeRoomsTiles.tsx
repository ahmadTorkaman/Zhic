import Link from 'next/link';
import { BlurInText, Container, ParallaxImage } from '@zhic/ui';
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
      <Container>
        <div className="zh-rooms__grid">
          {rooms.map((r) => (
            <Link key={r.slug} href={`/bedroom-set/${ROOM_TO_OCCUPANCY[r.slug]}`} className="zh-rooms__tile">
              <ParallaxImage
                src={r.coverUrl}
                alt={r.name}
                /* Teen cover: the bed sits in the lower part of the photo —
                   bias the window down hard and soften the parallax so the
                   bed stays in frame while scrolling. */
                verticalAmount={r.slug === 'teen' ? 20 : 80}
                shiftUp={r.slug === 'teen' ? 100 : 0}
                topRightRadius={48}
                className="zh-rooms__media"
              />
              <BlurInText as="div" className="zh-rooms__label">دسته‌ی سنی</BlurInText>
              <BlurInText as="div" className="zh-rooms__title">{r.name}</BlurInText>
              {r.tagline && <BlurInText as="p" className="zh-rooms__sub">{r.tagline}</BlurInText>}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
