import type { JournalCategoryTab } from '@/lib/journal-content';
import styles from './JournalTabs.module.css';

export type JournalTabsProps = {
  tabs: JournalCategoryTab[];
  activeKey: string;
};

/**
 * Category filter pills (Figma 227:498). Each tab links to its category page;
 * the active one is filled forest. Active state is route-driven (no client JS).
 */
export function JournalTabs({ tabs, activeKey }: JournalTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="دسته‌بندی ژورنال">
      {tabs.map((t) => (
        <a
          key={t.key}
          href={t.href}
          className={`${styles.tab} ${t.key === activeKey ? styles.active : ''}`}
          aria-current={t.key === activeKey ? 'page' : undefined}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}
