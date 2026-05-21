import Link from 'next/link';
import type { PayloadCategory } from '@/lib/payload';
import { SectionHeader } from './SectionHeader';
import tiles from './CategoryTiles.module.css';
import styles from './SiblingCategoriesStrip.module.css';

export type SiblingCategoriesStripProps = {
  siblings: PayloadCategory[];
  variant: 'leaf' | 'parent';
  /** Display name of the parent category. Used in the leaf eyebrow ("دیگر <parent.name>"). */
  parentName?: string;
  /** Optional "see all" link target on the leaf. */
  seeAllHref?: string;
};

export function SiblingCategoriesStrip({
  siblings, variant, parentName, seeAllHref,
}: SiblingCategoriesStripProps) {
  if (!siblings.length) return null;
  const eyebrow = variant === 'leaf'
    ? `دیگر ${parentName ?? 'دسته‌بندی‌ها'}`
    : 'دیگر دسته‌بندی‌ها';
  const title = variant === 'leaf' ? 'از مجموعه‌ی هم‌رده' : 'از همان قفسه';
  return (
    <>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        sub={variant === 'leaf' && seeAllHref ? `همه‌ی ${parentName ?? ''} ←` : variant === 'parent' ? 'همه‌ی دسته‌بندی‌ها ←' : undefined}
        subHref={variant === 'leaf' ? seeAllHref : '/products'}
      />
      <div className={styles.row}>
        {siblings.map((s) => (
          <Link key={s.slug} href={`/categories/${s.slug}`} className={`${styles.cardLink} ${tiles.quietCardLink}`}>
            <div className={`${styles.bg} ${tiles.quietCard} ${tiles.aspect1610}`} />
            <div className={styles.nm}>{s.name}</div>
            {/* Count line could be added if we precompute productCount on each sibling — defer. */}
          </Link>
        ))}
      </div>
    </>
  );
}
