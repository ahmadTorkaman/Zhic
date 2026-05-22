'use client';

import { PayloadImage } from '@/components/PayloadImage';
import { useVariantSelection } from './VariantSelectionContext';
import type { PayloadProduct } from '@/lib/payload';
import styles from './HeroImage.module.css';

export type HeroImageProps = {
  product: PayloadProduct;
};

export function HeroImage({ product }: HeroImageProps) {
  const { selectedVariant } = useVariantSelection();
  const cover = product.gallery?.[0] ?? null;
  const variantImage = selectedVariant?.image ?? null;

  // Derived: overlay is visible whenever the selected variant provides its own image.
  const overlayVisible = Boolean(variantImage?.url);

  return (
    <div className={styles.frame}>
      <div className={`${styles.layer} ${styles.base}`} aria-hidden={overlayVisible || undefined}>
        {cover ? <PayloadImage media={cover} alt={product.name} loading="eager" fetchPriority="high" /> : null}
      </div>
      <div
        className={`${styles.layer} ${styles.overlay} ${overlayVisible ? styles.visible : ''}`}
        aria-hidden
      >
        {variantImage ? <PayloadImage media={variantImage} alt="" loading="eager" /> : null}
      </div>
    </div>
  );
}
