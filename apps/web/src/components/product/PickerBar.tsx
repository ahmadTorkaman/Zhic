'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@zhic/money';
import { useVariantSelection } from './VariantSelectionContext';
import {
  deriveAxisOptions,
  variantPriceRials,
  buildAxisLabel,
  buildValueLabel,
} from '@/lib/variant-helpers';
import type { PayloadProduct, PayloadProductVariant } from '@/lib/payload';
import styles from './PickerBar.module.css';

export type PickerBarProps = {
  product: PayloadProduct;
  variants: PayloadProductVariant[];
  allowedAxes: string[];
  onInquiry?: (payload: {
    productId: string | number;
    variantId: string | number | null;
    selectedAxes: Record<string, string>;
  }) => void;
};

export function PickerBar({ product, variants, allowedAxes, onInquiry }: PickerBarProps) {
  const { selectedAxes, selectedVariant, selectAxis } = useVariantSelection();
  const [inView, setInView] = useState(false);
  const [priceFlip, setPriceFlip] = useState(false);
  const priceRef = useRef<HTMLSpanElement>(null);

  // Slide up on first paint via requestAnimationFrame
  useEffect(() => {
    const id = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Compute price and formatted display (number part only, "تومان" in separate span)
  const priceRials = variantPriceRials(product.basePriceRials ?? 0, selectedVariant);
  const priceDisplay = formatMoney(priceRials, { suffix: 'none' });

  // Cross-fade the price on selection change
  useEffect(() => {
    if (!priceRef.current) return;
    setPriceFlip(true);
    const t = window.setTimeout(() => setPriceFlip(false), 200);
    return () => window.clearTimeout(t);
  }, [priceDisplay]);

  const axisOptions = deriveAxisOptions(variants, allowedAxes);

  const handleInquiry = () => {
    onInquiry?.({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      selectedAxes: { ...selectedAxes },
    });
  };

  return (
    <div
      className={`${styles.bar} ${inView ? styles.in : ''}`}
      role="region"
      aria-label="انتخاب واریانت"
    >
      {axisOptions.length > 0 ? (
        <div className={styles.axes}>
          {axisOptions.map((axis) => {
            const labelId = `picker-axis-${axis.key}`;
            return (
              <div key={axis.key} className={styles.axisGroup}>
                <span id={labelId} className={styles.axisLabel}>
                  {buildAxisLabel(axis.key)}
                </span>
                <div role="radiogroup" aria-labelledby={labelId} className={styles.axisChips}>
                  {axis.values.map((value) => {
                    const isActive = selectedAxes[axis.key] === value;
                    // Disable if NO variant exists for the current partial selection + this value.
                    const wouldSelect = { ...selectedAxes, [axis.key]: value };
                    const candidate = variants.find(
                      (v) =>
                        v.axes.length === Object.keys(wouldSelect).length &&
                        v.axes.every((a) => wouldSelect[a.key] === a.value),
                    );
                    const disabled = candidate?.availability === 'discontinued';
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        aria-label={`${buildAxisLabel(axis.key)}: ${buildValueLabel(axis.key, value)}`}
                        aria-disabled={disabled || undefined}
                        className={`${styles.chip} ${isActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
                        onClick={() => !disabled && selectAxis(axis.key, value)}
                      >
                        {buildValueLabel(axis.key, value)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Single-SKU product — render a quiet placeholder so the grid keeps shape
        <div className={styles.axes} aria-hidden />
      )}

      <div className={styles.right}>
        <div className={styles.price}>
          <span className={styles.priceLbl}>قیمت</span>
          <span>
            <span
              ref={priceRef}
              className={`${styles.priceNum} ${priceFlip ? styles.flip : ''}`}
            >
              {priceDisplay}
            </span>
            <span className={styles.priceUnit}>تومان</span>
          </span>
        </div>
        <button type="button" className={styles.cta} onClick={handleInquiry}>
          استعلام قیمت
        </button>
      </div>
    </div>
  );
}
