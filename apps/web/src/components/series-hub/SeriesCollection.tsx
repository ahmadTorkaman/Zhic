import Image from 'next/image';
import type { SeriesProductCard } from '@/lib/series-hub-content';
import styles from './SeriesCollection.module.css';

export type SeriesCollectionProps = {
  heading: string;
  items: SeriesProductCard[];
};

/**
 * «قطعات سرویس» — 2-column grid of gold-bordered product cards: a contained
 * photo in a top band, then a cream info panel with the name, struck original
 * price, and sale price (centered, black ink). Figma 398:87 (redesign of 261:203
 * — the old frosted-glass floating label is gone).
 */
export function SeriesCollection({ heading, items }: SeriesCollectionProps) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.grid}>
        {items.map((it) => (
          <a key={it.key} href={it.href} className={styles.card}>
            <div className={styles.photo}>
              {it.img ? (
                <Image src={it.img} alt={it.name} fill sizes="195px" className={styles.img} />
              ) : null}
            </div>
            <div className={styles.info}>
              <p className={styles.name}>{it.name}</p>
              {it.originalPrice ? (
                <p className={styles.orig} dir="ltr">
                  {it.originalPrice}
                </p>
              ) : null}
              <p className={styles.price} dir="ltr">
                {it.price}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
