import Link from 'next/link';
import { toPersianDigits } from '@zhic/locale';
import type { PayloadCategory } from '@/lib/payload';
import tiles from './CategoryTiles.module.css';
import styles from './ChildCategoriesGrid.module.css';

export type ChildCategoriesGridProps = {
  items: (PayloadCategory & { _productCount?: number })[];
};

export function ChildCategoriesGrid({ items }: ChildCategoriesGridProps) {
  if (!items.length) {
    return (
      <p style={{ color: 'var(--color-stone)', textAlign: 'center', padding: '32px 0' }}>
        به‌زودی زیرنوع‌ها افزوده می‌شوند.
      </p>
    );
  }
  return (
    <div className={styles.grid} aria-label="زیرنوع‌ها">
      {items.map((child) => (
        <Link
          key={child.slug}
          href={`/bedroom-furniture/${child.slug}`}
          className={`${styles.cardLink} ${tiles.quietCardLink}`}
        >
          <div className={`${tiles.quietCard} ${tiles.aspect45}`}>
            {/* Future: per-child silhouette via child.silhouette enum — FU-CAT-e */}
          </div>
          <div className={styles.meta}>
            <div className={styles.name}>{child.name}</div>
            {typeof child._productCount === 'number' ? (
              <div className={styles.arrow}>
                {toPersianDigits(child._productCount)} محصول ←
              </div>
            ) : (
              <div className={styles.arrow}>مشاهده ←</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
