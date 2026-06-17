import Image from 'next/image';
import type { SeriesDetail } from '@/lib/series-hub-content';
import styles from './SeriesDesignDetails.module.css';

export type SeriesDesignDetailsProps = {
  heading: string;
  items: SeriesDetail[];
};

/**
 * «جزئیات طراحی» — bronze heading flanked by short gold dashes, a continuous
 * strip of four unequal-width image tiles (outer corners rounded), and a
 * label + tiny description under each column. Figma 261:155 (items right→left).
 */
export function SeriesDesignDetails({ heading, items }: SeriesDesignDetailsProps) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section} aria-label={heading}>
      <h2 className={styles.heading}>
        <span className={styles.dash} aria-hidden="true" />
        <span>{heading}</span>
        <span className={styles.dash} aria-hidden="true" />
      </h2>

      <div className={styles.strip}>
        {items.map((it, i) => (
          <div
            key={it.key}
            className={styles.tile}
            data-first={i === 0 || undefined}
            data-last={i === items.length - 1 || undefined}
            style={{ flexGrow: it.span }}
          >
            <Image src={it.img} alt={it.label} fill sizes="120px" className={styles.img} />
          </div>
        ))}
      </div>

      <div className={styles.captions}>
        {items.map((it) => (
          <div key={it.key} className={styles.caption} style={{ flexGrow: it.span }}>
            <span className={styles.connector} aria-hidden="true" />
            <p className={styles.label}>{it.label}</p>
            <p className={styles.desc}>{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
