'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCategoryFilter } from './category-filter-state';
import { CategoryFilterSidebar, type CategoryFilterSidebarProps } from './CategoryFilterSidebar';
import styles from './CategoryFilterMobile.module.css';
import sidebarStyles from './CategoryFilterSidebar.module.css';

export type CategoryFilterSheetProps = CategoryFilterSidebarProps;

export function CategoryFilterSheet(props: CategoryFilterSheetProps) {
  const { open, setOpen } = useCategoryFilter();

  // Body scroll lock + ESC to close
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.open : ''}`} onClick={() => setOpen(false)} />
      <div
        className={`${styles.sheet} ${open ? styles.open : ''}`}
        role="dialog"
        aria-label="فیلتر و مرتب‌سازی"
        aria-modal="true"
      >
        <div className={styles.grip} aria-hidden />
        <div className={styles.head}>
          <span className={styles.headTitle}>فیلتر و مرتب‌سازی</span>
          <button className={styles.close} onClick={() => setOpen(false)} aria-label="بستن">×</button>
        </div>
        <div className={styles.body}>
          {/* Reuse the sidebar's filter-list markup — force it visible on mobile via inline style.
              The sidebar's CSS hides it on mobile (display: none) by default; we override here
              so the sheet body shows the same filter options (DRY: same hrefs, same active state). */}
          <div className={sidebarStyles.sidebar} style={{ display: 'block', position: 'static', maxHeight: 'none', overflow: 'visible' }}>
            <CategoryFilterSidebar {...props} />
          </div>
        </div>
        <div className={styles.foot}>
          <Link href={props.basePath} className={styles.reset} onClick={() => setOpen(false)}>پاک کردن</Link>
          <button className={styles.apply} onClick={() => setOpen(false)}>نمایش نتایج</button>
        </div>
      </div>
    </>
  );
}
