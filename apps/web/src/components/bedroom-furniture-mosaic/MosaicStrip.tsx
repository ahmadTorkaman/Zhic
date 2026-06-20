import Image from 'next/image';
import styles from './MosaicStrip.module.css';

export type StripItem = {
  key: string;
  name: string;
  img?: string;
  href: string;
  /** Small gold eyebrow above the name (e.g. «طرح»). */
  eyebrow?: string;
};

export type MosaicStripProps = {
  heading: string;
  items: StripItem[];
  /** Optional trailing "see all" link. */
  seeAll?: { label: string; href: string };
};

/**
 * Secondary cross-link section in the mosaic language: a centered gold-marked
 * heading + a horizontal-scroll strip of small glass-band tiles. Reused for the
 * «طرح‌های مرتبط» design cross-links and the «دیگر دسته‌ها» sibling strips on the
 * category routes. Photo-less items render a sand fallback.
 */
export function MosaicStrip({ heading, items, seeAll }: MosaicStripProps) {
  if (!items.length) return null;
  return (
    <section className={styles.section} aria-label={heading}>
      <div className={styles.head}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.heading}>{heading}</span>
        <span className={styles.mark} aria-hidden="true" />
      </div>

      <div className={styles.row}>
        {items.map((it) => (
          <a key={it.key} href={it.href} className={styles.tile} aria-label={it.name}>
            {it.img ? (
              <Image src={it.img} alt="" fill sizes="170px" className={styles.photo} />
            ) : (
              <span className={styles.fallback} aria-hidden="true" />
            )}
            <span
              className={styles.caption}
              aria-hidden="true"
              style={{
                backdropFilter: 'blur(9px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(9px) saturate(1.2)',
              }}
            >
              {it.eyebrow && <span className={styles.eyebrow}>{it.eyebrow}</span>}
              <span className={styles.name}>{it.name}</span>
            </span>
          </a>
        ))}
      </div>

      {seeAll && (
        <a href={seeAll.href} className={styles.seeAll}>
          {seeAll.label}
        </a>
      )}
    </section>
  );
}
