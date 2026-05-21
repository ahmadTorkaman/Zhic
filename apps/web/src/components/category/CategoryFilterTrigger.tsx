'use client';

import { toPersianDigits } from '@zhic/locale';
import { useCategoryFilter } from './category-filter-state';
import styles from './CategoryFilterMobile.module.css';

export type CategoryFilterTriggerProps = { activeCount: number };

export function CategoryFilterTrigger({ activeCount }: CategoryFilterTriggerProps) {
  const { setOpen } = useCategoryFilter();
  return (
    <div className={styles.bar}>
      <button className={styles.btn} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="6"  x2="20" y2="6" />
          <line x1="4" y1="12" x2="14" y2="12" />
          <line x1="4" y1="18" x2="8"  y2="18" />
        </svg>
        فیلتر و مرتب‌سازی
        {activeCount > 0 && <span className={styles.badge}>{toPersianDigits(activeCount)}</span>}
      </button>
    </div>
  );
}
