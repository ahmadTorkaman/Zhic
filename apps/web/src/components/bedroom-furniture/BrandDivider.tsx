import styles from './BrandDivider.module.css';

/**
 * «zhic» wordmark between two hairlines — the small brand divider used at the
 * top of the category showcase (Figma 191:295) and beneath the room grid
 * (191:246). Decorative; the wordmark carries the brand alt.
 */
export function BrandDivider({ className }: { className?: string }) {
  return (
    <div className={className ? `${styles.divider} ${className}` : styles.divider}>
      <span className={styles.rule} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bedroom-furniture/zhic-wordmark.png" alt="ژیک" className={styles.wordmark} />
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}
