import type { ReactNode } from 'react';
import { Button, Stack } from '@zhic/ui';
import type { PayloadCategory, PayloadMaterial, ProductsQuery } from '@/lib/payload';
import {
  PRICE_BAND_LABEL,
  SIZE_BAND_LABEL,
} from '@/lib/products';

type Props = {
  categories: PayloadCategory[];
  materials: PayloadMaterial[];
  query: ProductsQuery;
  action: string;
};

const PRICE_BANDS: Array<NonNullable<ProductsQuery['price']>> = [
  'lt5',
  '5to15',
  '15to30',
  'gt30',
];

const SIZE_BANDS: Array<NonNullable<ProductsQuery['size']>> = [
  'small',
  'medium',
  'large',
];

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-small font-bold text-charcoal mb-1">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

export function ProductFilters({ categories, materials, query, action }: Props) {
  return (
    <form
      method="GET"
      action={action}
      className="flex flex-col gap-7 text-charcoal"
    >
      {/* Preserve sort across filter submits; page resets to 1 (omitted = default) */}
      {query.sort ? (
        <input type="hidden" name="sort" value={query.sort} />
      ) : null}

      <FieldGroup label="دسته‌بندی">
        <Stack gap="xs">
          <label className="inline-flex items-center gap-2 text-body cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              defaultChecked={!query.category}
              className="accent-charcoal"
            />
            <span>همه</span>
          </label>
          {categories.map((c) => (
            <label
              key={c.id}
              className="inline-flex items-center gap-2 text-body cursor-pointer"
            >
              <input
                type="radio"
                name="category"
                value={c.slug}
                defaultChecked={query.category === c.slug}
                className="accent-charcoal"
              />
              <span>{c.name}</span>
            </label>
          ))}
        </Stack>
      </FieldGroup>

      <FieldGroup label="متریال">
        <Stack gap="xs">
          {materials.map((m) => (
            <label
              key={m.id}
              className="inline-flex items-center gap-2 text-body cursor-pointer"
            >
              <input
                type="checkbox"
                name="material"
                value={m.slug}
                defaultChecked={query.materials?.includes(m.slug) ?? false}
                className="accent-charcoal"
              />
              <span>{m.name}</span>
            </label>
          ))}
        </Stack>
      </FieldGroup>

      <FieldGroup label="اندازه">
        <Stack gap="xs">
          <label className="inline-flex items-center gap-2 text-body cursor-pointer">
            <input
              type="radio"
              name="size"
              value=""
              defaultChecked={!query.size}
              className="accent-charcoal"
            />
            <span>همه</span>
          </label>
          {SIZE_BANDS.map((s) => (
            <label
              key={s}
              className="inline-flex items-center gap-2 text-body cursor-pointer"
            >
              <input
                type="radio"
                name="size"
                value={s}
                defaultChecked={query.size === s}
                className="accent-charcoal"
              />
              <span>{SIZE_BAND_LABEL[s]}</span>
            </label>
          ))}
        </Stack>
      </FieldGroup>

      <FieldGroup label="بازه‌ی قیمت">
        <Stack gap="xs">
          <label className="inline-flex items-center gap-2 text-body cursor-pointer">
            <input
              type="radio"
              name="price"
              value=""
              defaultChecked={!query.price}
              className="accent-charcoal"
            />
            <span>همه</span>
          </label>
          {PRICE_BANDS.map((p) => (
            <label
              key={p}
              className="inline-flex items-center gap-2 text-body cursor-pointer"
            >
              <input
                type="radio"
                name="price"
                value={p}
                defaultChecked={query.price === p}
                className="accent-charcoal"
              />
              <span>{PRICE_BAND_LABEL[p]}</span>
            </label>
          ))}
        </Stack>
      </FieldGroup>

      <Stack gap="sm">
        <Button type="submit" variant="primary" size="md" className="w-full">
          اعمال فیلترها
        </Button>
        <Button as="a" href={action} variant="ghost" size="sm" className="w-full">
          پاک کردن فیلترها
        </Button>
      </Stack>
    </form>
  );
}
