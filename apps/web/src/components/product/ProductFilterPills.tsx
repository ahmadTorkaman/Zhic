import { Pill } from '@zhic/ui';
import type { PayloadCategory, PayloadMaterial } from '@/lib/payload';

export type ProductFilterPillsProps = {
  activeCategory?: string | null;
  activeMaterial?: string | null;
  categories: Pick<PayloadCategory, 'name' | 'slug'>[];
  materials: Pick<PayloadMaterial, 'name' | 'slug'>[];
  /** Href builder so the parent route owns URL shape. */
  categoryHref: (slug: string | null) => string;
  materialHref: (slug: string | null) => string;
};

export function ProductFilterPills({
  activeCategory,
  activeMaterial,
  categories,
  materials,
  categoryHref,
  materialHref,
}: ProductFilterPillsProps) {
  const allActive = activeCategory == null && activeMaterial == null;

  return (
    /* c-filters: flex wrap gap-2 mb-5; mobile: overflow-x-auto flex-nowrap */
    <div className="mb-5 flex flex-nowrap gap-2 overflow-x-auto md:flex-wrap [scrollbar-width:none]">
      {/* "همه" pill */}
      <Pill as="a" href={categoryHref(null)} active={allActive}>
        همه
      </Pill>

      {/* Category pills */}
      {categories.map((c) => (
        <Pill
          key={c.slug}
          as="a"
          href={categoryHref(c.slug)}
          active={activeCategory === c.slug}
        >
          {c.name}
        </Pill>
      ))}

      {/* Thin separator between categories and materials */}
      {materials.length > 0 && (
        <span
          aria-hidden
          className="mx-1 inline-block w-px self-stretch bg-sand"
        />
      )}

      {/* Material pills */}
      {materials.map((m) => (
        <Pill
          key={m.slug}
          as="a"
          href={materialHref(m.slug)}
          active={activeMaterial === m.slug}
        >
          {m.name}
        </Pill>
      ))}
    </div>
  );
}
