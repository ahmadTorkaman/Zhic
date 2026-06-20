import { toPersianDigits } from '@zhic/locale';
import { GoldArrow } from '@zhic/ui';
import styles from './MosaicPager.module.css';

export type MosaicPagerProps = {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

/** First/last + a ±1 window around the current page, with ellipses. */
function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

/**
 * Pager in the mosaic aesthetic: gold line-arrows for prev/next, round page
 * pills (active = forest fill, ivory text), centered. Replaces the generic
 * @zhic/ui Pagination on the redesigned category routes.
 */
export function MosaicPager({ currentPage, totalPages, hrefFor }: MosaicPagerProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(currentPage, totalPages);
  const prevHref = currentPage > 1 ? hrefFor(currentPage - 1) : null;
  const nextHref = currentPage < totalPages ? hrefFor(currentPage + 1) : null;

  return (
    <nav className={styles.pager} aria-label="صفحه‌بندی">
      {/* prev — RTL forward is left, so the prev glyph points right (flipped). */}
      {prevHref ? (
        <a href={prevHref} className={styles.arrow} aria-label="صفحه‌ی قبل" rel="prev">
          <GoldArrow className={`${styles.icon} ${styles.prev}`} />
        </a>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          <GoldArrow className={`${styles.icon} ${styles.prev}`} />
        </span>
      )}

      <ol className={styles.pages}>
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`e${i}`} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              {p === currentPage ? (
                <span className={styles.active} aria-current="page">
                  {toPersianDigits(p)}
                </span>
              ) : (
                <a
                  href={hrefFor(p)}
                  className={styles.page}
                  aria-label={`صفحه‌ی ${toPersianDigits(p)}`}
                >
                  {toPersianDigits(p)}
                </a>
              )}
            </li>
          ),
        )}
      </ol>

      {nextHref ? (
        <a href={nextHref} className={styles.arrow} aria-label="صفحه‌ی بعد" rel="next">
          <GoldArrow className={styles.icon} />
        </a>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          <GoldArrow className={styles.icon} />
        </span>
      )}
    </nav>
  );
}
