import Image from 'next/image';
import type { LeafProduct } from '@/lib/leaf-content';
import styles from './ProductMosaic.module.css';

export type ProductMosaicProps = {
  heading: string;
  products: LeafProduct[];
};

/**
 * Leaf product grid (Phase 2) — a uniform 2-col grid of product cards in the
 * hub glass-tile language: contained photo on cream + a full-width rounded
 * glass caption band carrying the product name, a struck original price (sale
 * only) and the price (toman). Matches /bedroom-set/[slug]/[slug]'s price
 * treatment. Props-driven; the live route maps Payload products → LeafProduct.
 */
export function ProductMosaic({ heading, products }: ProductMosaicProps) {
  if (products.length === 0) return null;
  return (
    <section className={styles.section} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.grid}>
        {products.map((p) => (
          <a key={p.key} href={p.href} className={styles.card} aria-label={p.name}>
            <span className={styles.photoWrap}>
              {p.img ? (
                <Image
                  src={p.img}
                  alt=""
                  fill
                  sizes="(max-width: 430px) 44vw, 190px"
                  className={styles.photo}
                />
              ) : null}
            </span>
            <span
              className={styles.caption}
              aria-hidden="true"
              style={{
                backdropFilter: 'blur(9px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(9px) saturate(1.2)',
              }}
            >
              <span className={styles.name}>{p.name}</span>
              {p.originalPrice ? (
                <span className={styles.orig} dir="rtl">
                  {p.originalPrice}
                </span>
              ) : null}
              <span className={styles.price} dir="rtl">
                {p.price}
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
