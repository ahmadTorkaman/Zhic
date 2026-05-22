'use client';

import { useEffect, useState } from 'react';
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
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Toggle overlay visibility based on whether the selected variant has its
  // own image. When variantImage becomes null, fade overlay out; when it
  // becomes set, fade in.
  useEffect(() => {
    setOverlayVisible(Boolean(variantImage?.url));
  }, [variantImage?.url]);

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
