import Image from 'next/image';
import type { SeriesProductCard } from '@/lib/series-hub-content';
import styles from './SeriesCollection.module.css';

export type SeriesCollectionProps = {
  heading: string;
  items: SeriesProductCard[];
};

/**
 * «قطعات سرویس» — 2-column grid of gold-bordered product cards: photo + cream
 * label band with name, struck original price, and sale price. Figma 261:203.
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
            <div className={`${styles.label} float-card`}>
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
