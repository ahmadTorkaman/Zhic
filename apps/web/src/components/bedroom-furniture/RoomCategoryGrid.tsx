import Image from 'next/image';
import { GoldArrow } from '@zhic/ui';
import type { RoomCard } from '@/lib/bedroom-furniture';
import styles from './RoomCategoryGrid.module.css';

// Darkening sage ramp (Figma 191:209–212), applied by row position so the
// content layer only needs to supply name/image/href.
const BG_RAMP = [
  'var(--color-sage)',
  'var(--color-sage-deep)',
  'var(--color-forest-deep)',
  'var(--color-forest-night)',
];

export type RoomCategoryGridProps = {
  rooms: RoomCard[];
};

/**
 * Room-based category grid (Figma 191:209–216). Full-width rows on a darkening
 * sage ramp, each with a left photo and a right two-line label («اتاق» + the
 * occupancy name, kashida-stretched via `display`).
 */
export function RoomCategoryGrid({ rooms }: RoomCategoryGridProps) {
  return (
    <div className={styles.grid}>
      {rooms.map((r, i) => (
        <a
          key={r.key}
          href={r.href}
          className={styles.row}
          style={{ background: BG_RAMP[i % BG_RAMP.length] }}
          aria-label={`اتاق ${r.name}`}
        >
          <div className={styles.photo}>
            <Image src={r.img} alt="" fill sizes="(max-width: 480px) 64vw, 270px" />
          </div>
          <div className={styles.label} aria-hidden="true">
            <span className={styles.nameWrap}>
              <span className={styles.kicker}>اتاق</span>
              <span className={styles.name}>{r.display ?? r.name}</span>
            </span>
            <span className={styles.more}>
              مشاهده
              <GoldArrow className={styles.moreArrow} />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
