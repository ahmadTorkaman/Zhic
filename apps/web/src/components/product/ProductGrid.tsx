import { HoverGallery } from '@/components/product/HoverGallery';
import { Tile } from '@/components/tile/Tile';
import { productPath, type PayloadProduct } from '@/lib/payload';

export type ProductGridProps = {
  products: PayloadProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-9 text-center text-stone">محصولی پیدا نشد.</p>
    );
  }

  return (
    /* c-grid: 4/3/2/2 across xl/lg/sm/base, gap-[var(--space-5)] */
    <div className="grid grid-cols-2 gap-[var(--space-5)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const materials = p.materials?.map((m) => m.name) ?? [];
        const meta = materials.length > 0 ? materials.join(' · ') : undefined;

        return (
          <Tile
            key={p.id}
            href={productPath(p.slug)}
            image={
              <HoverGallery
                images={p.gallery ?? []}
                alt={p.name}
                fallbackText="تصویر به‌زودی"
                // Borderless WebP product silhouettes go edge-to-edge in the
                // source file. `object-contain` keeps the whole shape visible
                // (no cropping); p-6 pulls the visible area in ~24px so the
                // cream card background reads as a frame around the product.
                className="h-full w-full object-contain p-6"
              />
            }
            aspect="4/5"
            title={p.name}
            meta={meta}
            price={p.basePriceRials ?? undefined}
            hover="full"
          />
        );
      })}
    </div>
  );
}
