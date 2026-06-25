import Image from 'next/image';
import type { LeafProduct } from '@/lib/leaf-content';
import styles from './ProductMosaic.module.css';

export type ProductMosaicProps = {
  heading: string;
  products: LeafProduct[];
};

/**
 * Leaf product grid — a uniform 2-col grid of gold-bordered product cards: a
 * contained photo floating over an ivory base, then a cream panel rising from
 * the bottom with the name, struck original price, and sale price (centered,
 * black ink). Same card as «قطعات سرویس» on /bedroom-set/[slug]/[series]
 * (Figma 398:87) — the old frosted-glass caption band is gone. Props-driven;
 * the live route maps Payload products → LeafProduct.
 */
export function ProductMosaic({ heading, products }: ProductMosaicProps) {
  if (products.length === 0) return null;
  return (
    <section className={styles.section} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.grid}>
        {products.map((p) => (
          <a key={p.key} href={p.href} className={styles.card} aria-label={p.name}>
            <div className={styles.photo}>
              {p.img ? (
                <Image src={p.img} alt="" fill sizes="195px" className={styles.img} />
              ) : null}
            </div>
            <div className={styles.info}>
              <p className={styles.name}>{p.name}</p>
              {p.originalPrice ? (
                <p className={styles.orig} dir="ltr">
                  {p.originalPrice}
                </p>
              ) : null}
              <p className={styles.price} dir="ltr">
                {p.price}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
