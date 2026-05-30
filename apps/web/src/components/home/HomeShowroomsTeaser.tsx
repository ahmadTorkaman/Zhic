import Link from 'next/link';
import { BlurInText, Container } from '@zhic/ui';
import './home-showrooms-teaser.css';

export type HomeShowroomCard = {
  slug: string;
  city: string;
  addressLine: string;
  phone?: string;
  coverUrl: string | null;
  isCentral?: boolean;
};

export type HomeShowroomsTeaserProps = {
  showrooms: HomeShowroomCard[];
};

// On-brand placeholder for branches without a photo yet — sand→walnut radial,
// matching the CategoryHero convention. The card's ::after adds the vignette.
const PLACEHOLDER_COVER = 'var(--gradient-glow-caramel)';

export function HomeShowroomsTeaser({ showrooms }: HomeShowroomsTeaserProps) {
  if (showrooms.length === 0) return null;
  return (
    <section className="zh-st" aria-label="شوروم‌ها">
      <Container>
        <div className="zh-st__head">
          <div className="zh-st__head-left">
            <BlurInText as="div" className="zh-st__eyebrow">شوروم‌ها</BlurInText>
            <BlurInText as="div" className="zh-st__title">ما را در شهر خودتان ببینید</BlurInText>
          </div>
          <Link href="/showrooms" className="zh-st__cta">
            <BlurInText as="span">فهرست کامل</BlurInText>
            <span aria-hidden className="zh-st__arrow" />
          </Link>
        </div>

        <div className="zh-st__grid">
          {showrooms.map((s) => (
            <Link key={s.slug} href={`/showrooms/${s.slug}`} className="zh-st__card">
              <div
                className="zh-st__cover"
                style={{ backgroundImage: s.coverUrl ? `url(${s.coverUrl})` : PLACEHOLDER_COVER }}
                aria-hidden
              />
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
