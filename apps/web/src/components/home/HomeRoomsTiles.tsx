import Link from 'next/link';
import { Container, ParallaxImage } from '@zhic/ui';
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

export function HomeRoomsTiles({ rooms }: HomeRoomsTilesProps) {
  if (rooms.length === 0) return null;
  return (
    <section className="zh-rooms" aria-label="دسته‌بندی سنی">
      <Container>
        <div className="zh-rooms__grid">
          {rooms.map((r) => (
            <Link key={r.slug} href={`/rooms/${r.slug}`} className="zh-rooms__tile">
              <ParallaxImage
                src={r.coverUrl}
                alt={r.name}
                verticalAmount={80}
                topRightRadius={48}
                className="zh-rooms__media"
              />
              <div className="zh-rooms__label">دسته‌ی سنی</div>
              <div className="zh-rooms__title">{r.name}</div>
              {r.tagline && <p className="zh-rooms__sub">{r.tagline}</p>}
              <span className="zh-rooms__cta">
                مشاهده
                <span aria-hidden className="zh-rooms__arrow" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
