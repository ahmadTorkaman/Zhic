import { PayloadImage } from '@/components/PayloadImage';
import { Tile } from '@/components/tile/Tile';
import { HorizontalTile } from '@/components/tile/HorizontalTile';
import { productPath, type PayloadProduct } from '@/lib/payload';

export type ProductIndexHeroProps = {
  products: PayloadProduct[]; // uses first 4
};

export function ProductIndexHero({ products }: ProductIndexHeroProps) {
  if (products.length === 0) return null;

  const featured = products[0]!;
  const miniCards = products.slice(1, 4);

  const featuredMeta = [
    ...(featured.materialIds?.map((m) => m.name) ?? []),
    featured.piece_type ?? '',
  ]
    .filter(Boolean)
    .join(' · ') || undefined;

  return (
    /* c-hero: 2-col on md+, gap-5, collapses to 1-col on mobile */
    <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* Left — featured big tile */}
      <Tile
        href={productPath(featured.slug)}
        image={
          <PayloadImage
            media={featured.gallery?.[0] ?? null}
            alt={featured.name}
            fallbackText="تصویر"
          />
        }
        aspect="3/4"
        title={featured.name}
        titleSize="h4"
        meta={featuredMeta}
        price={featured.basePriceRials ?? undefined}
        badge="جدید"
        hover="full"
      />

      {/* Right — side-stack: 3 mini cards */}
      {/* Mobile: flex row, horizontal scroll; Desktop: flex column */}
      <div className="flex flex-row gap-5 overflow-x-auto snap-x md:flex-col md:overflow-x-visible">
        {miniCards.map((p) => {
          const meta = [
            ...(p.materialIds?.map((m) => m.name) ?? []),
            p.piece_type ?? '',
          ]
            .filter(Boolean)
            .join(' · ') || undefined;

          return (
            <div key={p.id} className="min-w-[280px] snap-start md:min-w-0">
              <HorizontalTile
                href={productPath(p.slug)}
                image={
                  <PayloadImage
                    media={p.gallery?.[0] ?? null}
                    alt={p.name}
                    fallbackText="تصویر"
                  />
                }
                imageWidth={120}
                title={p.name}
                meta={meta}
                price={p.basePriceRials ?? undefined}
                className="rounded-md p-4 hover:bg-cream transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
