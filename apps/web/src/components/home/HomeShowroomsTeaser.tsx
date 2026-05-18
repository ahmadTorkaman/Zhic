import Link from 'next/link';
import { Container } from '@zhic/ui';
import './home-showrooms-teaser.css';

export type HomeShowroomCard = {
  slug: string;
  city: string;
  addressLine: string;
  phone?: string;
  coverUrl: string;
  isCentral?: boolean;
};

export type HomeShowroomsTeaserProps = {
  showrooms: HomeShowroomCard[];
};

export function HomeShowroomsTeaser({ showrooms }: HomeShowroomsTeaserProps) {
  if (showrooms.length === 0) return null;
  return (
    <section className="zh-st" aria-label="شوروم‌ها">
      <Container>
        <div className="zh-st__head">
          <div className="zh-st__head-left">
            <div className="zh-st__eyebrow">شوروم‌ها</div>
            <div className="zh-st__title">ما را در شهر خودتان ببینید</div>
          </div>
          <Link href="/showrooms" className="zh-st__cta">
            فهرست کامل
            <span aria-hidden className="zh-st__arrow" />
          </Link>
        </div>

        <div className="zh-st__grid">
          {showrooms.map((s) => (
            <Link key={s.slug} href={`/showrooms/${s.slug}`} className="zh-st__card">
              <div className="zh-st__cover" style={{ backgroundImage: `url(${s.coverUrl})` }} aria-hidden />
              <div className="zh-st__city">
                {s.city}
                {s.isCentral ? ' · شوروم مرکزی' : ''}
              </div>
              <div className="zh-st__addr">{s.addressLine}</div>
              {s.phone && <div className="zh-st__phone" dir="ltr">{s.phone}</div>}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
