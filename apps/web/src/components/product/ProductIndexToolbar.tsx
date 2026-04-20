import { toPersianDigits } from '@zhic/locale';

export type ProductSort = 'newest' | 'name' | 'price_asc' | 'price_desc';

export type ProductIndexToolbarProps = {
  totalCount: number;
  currentSort: ProductSort;
  /** Maps sort value → full href the toolbar Select will link to on change. */
  sortHrefs: Record<ProductSort, string>;
};

const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'جدیدترین',
  name: 'نام',
  price_asc: 'ارزان‌ترین',
  price_desc: 'گران‌ترین',
};

export function ProductIndexToolbar({
  totalCount,
  currentSort,
  sortHrefs: _sortHrefs,
}: ProductIndexToolbarProps) {
  return (
    /* toolbar: flex items-center justify-between, border-top/bottom sand, padY=4, mb-7 */
    <div className="mb-7 flex items-center justify-between border-b border-t border-sand py-4 text-small text-stone">
      <span>{toPersianDigits(totalCount)} محصول</span>

      {/* Native select — visual only; future client island will wire navigation */}
      <select
        data-sort={currentSort}
        defaultValue={currentSort}
        className="cursor-pointer rounded-md border border-sand bg-transparent px-3 py-2 font-[inherit] text-small text-charcoal transition-[border-color] duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] focus:border-forest focus:shadow-[0_0_0_2px_var(--color-focus-ring)] focus:outline-none"
      >
        {(Object.keys(SORT_LABELS) as ProductSort[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABELS[k]}
          </option>
        ))}
      </select>
    </div>
  );
}
