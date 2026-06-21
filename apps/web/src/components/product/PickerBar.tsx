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

  // Compute price and formatted display (number part only, "تومان" in separate span)
  // Computed before hooks so useState can use it as the initial value.
  const priceRials = variantPriceRials(product.basePriceRials ?? 0, selectedVariant);
  const priceDisplay = formatMoney(priceRials, { suffix: 'none' });

  const [inView, setInView] = useState(false);
  const [priceFlip, setPriceFlip] = useState(false);
  const [displayedPrice, setDisplayedPrice] = useState(priceDisplay);
  const initialRender = useRef(true);
  const priceRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Slide up on first paint via requestAnimationFrame
  useEffect(() => {
    const id = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Park the picker above the footer contact section (.zh-fcs) on scroll.
  // `bottom` is set DIRECTLY on the element (no CSS variable indirection) so
  // there's nothing in the cascade that could swallow the update.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const baseBottom = window.matchMedia('(max-width: 767px)').matches ? 12 : 16;
    let raf = 0;

    const update = () => {
      raf = 0;
      // Park above the consultation CTA band (.zh-foot-cta), which sits between
      // the product content and the dark <footer>. Anchoring to <footer> would
      // let the bar float over that CTA card and overlay .zh-foot-cta__body, so
      // anchor to the CTA section's top instead (fall back to <footer>, then the
      // base offset). The bar comes to rest just above the CTA and scrolls away
      // with it rather than covering it.
      const stop =
        document.querySelector<HTMLElement>('.zh-foot-cta') ??
        document.querySelector<HTMLElement>('footer');
      if (!stop) {
        bar.style.bottom = `${baseBottom}px`;
        return;
      }
      const rect = stop.getBoundingClientRect();
      const intrusion = Math.max(0, window.innerHeight - rect.top);
      bar.style.bottom = `${baseBottom + intrusion}px`;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Cross-fade the price on selection change: old visible → fade out → swap text → fade in.
  // Skip on first mount (no animation needed for initial display).
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      setDisplayedPrice(priceDisplay);
      return;
    }
    // No change → no animation
    if (displayedPrice === priceDisplay) return;
    // Start the fade-out
    setPriceFlip(true);
    const swap = window.setTimeout(() => setDisplayedPrice(priceDisplay), 180);
    const off = window.setTimeout(() => setPriceFlip(false), 200);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(off);
    };
  }, [priceDisplay, displayedPrice]);

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
      ref={barRef}
      className={`${styles.bar} ${inView ? styles.in : ''}`}
      role="region"
      aria-label="انتخاب واریانت"
      // Inline glass — set here (not in CSS module) so the build pipeline
      // can't strip the unprefixed `backdrop-filter` and we get a guaranteed
      // 70% ivory + 64px blur regardless of what LightningCSS does. Values
      // come from the shared chrome-glass tokens (tokens.css) via var().
      style={{
        backgroundColor: 'var(--glass-bg-chrome)',
        backdropFilter: 'blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate-chrome))',
        WebkitBackdropFilter: 'blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate-chrome))',
      }}
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
              {displayedPrice}
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
