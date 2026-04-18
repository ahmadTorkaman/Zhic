'use client';

import { useRef } from 'react';
import { Select } from '@zhic/ui';
import type { ProductsQuery } from '@/lib/payload';
import { SORT_LABEL } from '@/lib/products';

type Props = {
  query: ProductsQuery;
};

const SORTS: Array<NonNullable<ProductsQuery['sort']>> = [
  'newest',
  'name',
  'priceAsc',
  'priceDesc',
];

export function SortForm({ query }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const handleChange = () => {
    formRef.current?.submit();
  };
  return (
    <form ref={formRef} method="GET" className="flex items-center gap-3">
      {/* Preserve all current filters across sort changes; page resets. */}
      {query.category ? (
        <input type="hidden" name="category" value={query.category} />
      ) : null}
      {query.materials?.map((m) => (
        <input key={m} type="hidden" name="material" value={m} />
      ))}
      {query.size ? (
        <input type="hidden" name="size" value={query.size} />
      ) : null}
      {query.price ? (
        <input type="hidden" name="price" value={query.price} />
      ) : null}
      <label htmlFor="sort" className="text-small text-stone whitespace-nowrap">
        مرتب‌سازی
      </label>
      <Select
        id="sort"
        name="sort"
        defaultValue={query.sort ?? 'newest'}
        size="sm"
        onChange={handleChange}
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABEL[s]}
          </option>
        ))}
      </Select>
      <noscript>
        <button
          type="submit"
          className="rounded-md border border-charcoal px-3 py-2 text-small"
        >
          اعمال
        </button>
      </noscript>
    </form>
  );
}
