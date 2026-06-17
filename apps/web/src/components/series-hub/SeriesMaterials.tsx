import Image from 'next/image';
import { Fragment } from 'react';
import type { SeriesMaterial } from '@/lib/series-hub-content';
import styles from './SeriesMaterials.module.css';

export type SeriesMaterialsProps = {
  heading: string;
  items: SeriesMaterial[];
};

/**
 * «متریال های استفاده شده» — cream card with circular material swatches, each
 * with a bold name and a light spec sub-line, gold vertical dividers between.
 * Figma 261:175 (items stored right→left to match the RTL row).
 */
export function SeriesMaterials({ heading, items }: SeriesMaterialsProps) {
  if (items.length === 0) return null;
  return (
    <section className={styles.card} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.row}>
        {items.map((m, i) => (
          <Fragment key={m.key}>
            {i > 0 ? <span className={styles.divider} aria-hidden="true" /> : null}
            <div className={styles.item}>
              <div className={styles.swatch}>
                <Image src={m.img} alt={m.name} fill sizes="82px" className={styles.img} />
              </div>
              <p className={styles.name}>{m.name}</p>
              <p className={styles.sub}>{m.sub}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
