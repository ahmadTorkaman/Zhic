import type { PayloadCategory, PayloadMaterial, ProductsQuery } from '@/lib/payload';

type Props = {
  categories: PayloadCategory[];
  materials: PayloadMaterial[];
  query: ProductsQuery;
  action: string;
};

function pillClass(active: boolean): string {
  const base =
    'inline-flex items-center rounded-pill px-4 py-1.5 text-eyebrow font-bold transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]';
  return active
    ? `${base} bg-charcoal text-ivory`
    : `${base} bg-cream text-charcoal hover:bg-sand`;
}

export function ProductFilterPills({
  categories,
  materials,
  query,
  action,
}: Props) {
  const activeMaterial = query.materials?.[0]; // single-select in pill bar

  function renderPill(opts: {
    name: 'category' | 'material';
    value: string | null;
    label: string;
    active: boolean;
  }) {
    return (
      <form
        key={`${opts.name}:${opts.value ?? 'all'}`}
        method="GET"
        action={action}
        className="contents"
      >
        {/* Preserve sort + the OTHER axis + size + price across pill clicks; everything else resets. */}
        {query.sort ? <input type="hidden" name="sort" value={query.sort} /> : null}
        {query.size ? <input type="hidden" name="size" value={query.size} /> : null}
        {query.price ? <input type="hidden" name="price" value={query.price} /> : null}
        {opts.name === 'category' && activeMaterial ? (
          <input type="hidden" name="material" value={activeMaterial} />
        ) : null}
        {opts.name === 'material' && query.category ? (
          <input type="hidden" name="category" value={query.category} />
        ) : null}
        {opts.value !== null ? (
          <input type="hidden" name={opts.name} value={opts.value} />
        ) : null}
        <button
          type="submit"
          aria-current={opts.active ? 'true' : undefined}
          className={pillClass(opts.active)}
        >
          {opts.label}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-row flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible">
      {/* Categories */}
      {renderPill({
        name: 'category',
        value: null,
        label: 'همه',
        active: !query.category,
      })}
      {categories.map((c) =>
        renderPill({
          name: 'category',
          value: c.slug,
          label: c.name,
          active: query.category === c.slug,
        }),
      )}
      {/* Sand vertical divider */}
      <span aria-hidden className="mx-2 h-6 w-px bg-sand" />
      {/* Materials */}
      {materials.map((m) =>
        renderPill({
          name: 'material',
          value: m.slug,
          label: m.name,
          active: activeMaterial === m.slug,
        }),
      )}
    </div>
  );
}
