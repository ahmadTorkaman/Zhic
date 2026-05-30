'use client';

import { useEffect, useRef, useState } from 'react';
import { PayloadImage } from '@/components/PayloadImage';
import { useVariantSelection } from './VariantSelectionContext';
import type { PayloadProduct, PayloadMedia } from '@/lib/payload';
import styles from './HeroImage.module.css';

export type HeroImageProps = {
  product: PayloadProduct;
};

export function HeroImage({ product }: HeroImageProps) {
  const { selectedVariant } = useVariantSelection();
  const cover = product.gallery?.[0] ?? null;
  const variantImage: PayloadMedia | null = selectedVariant?.image ?? null;

  // Cross-fade pattern (mirrors PickerBar's price flip): hold the LAST shown
  // variant image in state, drop opacity to 0 on change, swap the img mid-fade,
  // restore opacity to 1. CSS transition on .layer is 300ms.
  const [shownImage, setShownImage] = useState<PayloadMedia | null>(variantImage);
  const [fading, setFading] = useState(false);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      setShownImage(variantImage);
      return;
    }
    const currentUrl = shownImage?.url ?? null;
    const nextUrl = variantImage?.url ?? null;
    if (currentUrl === nextUrl) return;

    setFading(true);
    // At t=280 (transition duration): swap the img AND restore .visible in the
    // same React batch — React applies both state updates atomically, so the
    // overlay rerenders with the new img already mounted and the opacity
    // transition runs 0→1 from there. Clean cross-fade.
    const t = window.setTimeout(() => {
      setShownImage(variantImage);
      setFading(false);
    }, 280);
    return () => window.clearTimeout(t);
  }, [variantImage, shownImage]);

  const hasVariantImage = Boolean(shownImage?.url);
  const overlayVisible = hasVariantImage && !fading;

  return (
    <div className={styles.frame}>
      <div
        className={`${styles.layer} ${styles.base} ${hasVariantImage ? styles.baseHidden : ''}`}
        aria-hidden={hasVariantImage || undefined}
      >
        {cover ? <PayloadImage media={cover} alt={product.name} loading="eager" fetchPriority="high" className="" /> : null}
      </div>
      <div
        className={`${styles.layer} ${styles.overlay} ${overlayVisible ? styles.visible : ''}`}
        aria-hidden
      >
        {shownImage ? <PayloadImage media={shownImage} alt="" loading="eager" className="" /> : null}
      </div>
    </div>
  );
}
