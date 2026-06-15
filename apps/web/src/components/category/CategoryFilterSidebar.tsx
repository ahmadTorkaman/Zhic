// apps/web/src/components/category/CategoryFilterSidebar.tsx — SERVER component.
import Link from 'next/link';
import { toPersianDigits } from '@zhic/locale';
import { buildFilterHref } from '@/lib/category-filter-url';
import styles from './CategoryFilterSidebar.module.css';

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'جدیدترین' },
  { key: 'price_asc', label: 'قیمت: ارزان‌ترین' },
  { key: 'price_desc', label: 'قیمت: گران‌ترین' },
  { key: 'name', label: 'الفبا' },
];

export type CategoryFilterSidebarProps = {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  availableDesigns: { slug: string; name: string; count: number }[];
  availableMaterials: { slug: string; name: string; count: number }[];
  availableSizes?: { value: string; label: string; count: number }[];
  availableAges?: readonly { slug: string; name: string }[];
};

function pickStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
}

export function CategoryFilterSidebar({
  basePath, searchParams,
  availableDesigns, availableMaterials, availableSizes, availableAges,
}: CategoryFilterSidebarProps) {
  const activeSort = (pickStr(searchParams, 'sort') ?? 'newest') as SortKey;
  const activeDesign = pickStr(searchParams, 'design');
  const activeMaterial = pickStr(searchParams, 'material');
  const activeSize = pickStr(searchParams, 'size');
  const activeAge = pickStr(searchParams, 'age');

  return (
    <aside className={styles.sidebar} aria-label="فیلتر">
      <div className={styles.head}>
        <span className={styles.title}>فیلتر</span>
        <Link href={basePath} className={styles.clear}>پاک کردن همه</Link>
      </div>

      <div className={styles.group}>
        <div className={styles.label}>مرتب‌سازی</div>
        <div className={styles.list}>
          {SORT_OPTIONS.map((s) => {
            const isActive = activeSort === s.key;
            const href = buildFilterHref(basePath, searchParams, { sort: s.key === 'newest' ? null : s.key });
            return (
              <Link key={s.key} href={href} className={`${styles.opt} ${styles.radio} ${isActive ? styles.active : ''}`} aria-current={isActive ? 'true' : undefined}>
                <span className={styles.check} />
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {availableDesigns.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>طرح</div>
          <div className={styles.list}>
            {availableDesigns.map((d) => {
              const isActive = activeDesign === d.slug;
              const href = buildFilterHref(basePath, searchParams, { design: isActive ? null : d.slug });
              return (
                <Link key={d.slug} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`} aria-current={isActive ? 'true' : undefined}>
                  <span className={styles.check} />
                  {d.name}
                  <span className={styles.count}>{toPersianDigits(d.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {availableMaterials.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>روکش چوب</div>
          <div className={styles.list}>
            {availableMaterials.map((m) => {
              const isActive = activeMaterial === m.slug;
              const href = buildFilterHref(basePath, searchParams, { material: isActive ? null : m.slug });
              return (
                <Link key={m.slug} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`} aria-current={isActive ? 'true' : undefined}>
                  <span className={styles.check} />
                  {m.name}
                  <span className={styles.count}>{toPersianDigits(m.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {availableSizes && availableSizes.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>اندازه</div>
          <div className={styles.list}>
            {availableSizes.map((s) => {
              const isActive = activeSize === s.value;
              const href = buildFilterHref(basePath, searchParams, { size: isActive ? null : s.value });
              return (
                <Link key={s.value} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`} aria-current={isActive ? 'true' : undefined}>
                  <span className={styles.check} />
                  {s.label}
                  <span className={styles.count}>{toPersianDigits(s.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {availableAges && availableAges.length > 0 && (
        <div className={styles.group}>
          <div className={styles.label}>گروه سنی</div>
          <div className={styles.list}>
            {availableAges.map((a) => {
              const isActive = activeAge === a.slug;
              const href = buildFilterHref(basePath, searchParams, { age: isActive ? null : a.slug, page: null });
              return (
                <Link key={a.slug} href={href} className={`${styles.opt} ${isActive ? styles.active : ''}`} aria-current={isActive ? 'true' : undefined}>
                  <span className={styles.check} />
                  {a.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
