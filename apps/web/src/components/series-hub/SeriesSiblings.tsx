import Image from 'next/image';
import { GoldArrow } from '@zhic/ui';
import type { SeriesSibling } from '@/lib/series-hub-content';
import styles from './SeriesSiblings.module.css';

export type SeriesSiblingsProps = {
  /** Sibling cross-links — other designs in the same age group (Figma 261:233
   *  bars, finalized as full-width sage bands per 261:238). */
  siblings: SeriesSibling[];
  /** Optional highlighted band rendered first (e.g. the occupancy variant on
   *  non-iron designs). */
  featured?: SeriesSibling | null;
};

/**
 * Stack of full-width sage cross-link bands — photo on the physical left, white
 * kicker + name + «مشاهده →» on the right. Figma 261:238 (style) × 261:233 (slot).
 */
export function SeriesSiblings({ siblings, featured = null }: SeriesSiblingsProps) {
  // Other-design bands (gold) first, then the highlighted same-design /
  // other-occupancy band (sage), which sits last in the comp — Figma 261:233
  // then 261:238.
  const bands = [
    ...siblings.map((s) => ({ s, gold: true })),
    ...(featured ? [{ s: featured, gold: false }] : []),
  ];
  if (bands.length === 0) return null;
  return (
    <section className={styles.section} aria-label="طرح‌های دیگر">
      {bands.map(({ s, gold }) => (
        <a key={s.key} className={gold ? `${styles.band} ${styles.gold}` : styles.band} href={s.href}>
          <div className={styles.photo}>
            {s.img ? (
              <Image src={s.img} alt={s.name} fill sizes="430px" className={styles.img} />
            ) : null}
          </div>
          <div className={styles.label}>
            <span className={styles.kicker}>{s.kicker}</span>
            <span className={styles.name}>{s.name}</span>
            <span className={styles.more}>
              <span>مشاهده</span>
              <GoldArrow className={styles.arrow} />
            </span>
          </div>
        </a>
      ))}
    </section>
  );
}
