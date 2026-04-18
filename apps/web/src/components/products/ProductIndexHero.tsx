import type { PayloadProduct } from '@/lib/payload';
import { productPath } from '@/lib/payload';
import { MoneyDisplay } from '@zhic/ui';
import { PayloadImage } from '@/components/PayloadImage';

type Props = {
  products: PayloadProduct[];
};

function FeaturedTile({ product }: { product: PayloadProduct }) {
  return (
    <a
      href={productPath(product.slug)}
      className="group block transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:translate-y-[var(--hover-lift-card)]"
    >
      <div className="relative mb-4 aspect-[3/4] overflow-hidden border border-transparent bg-cream transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] group-hover:border-sand group-hover:bg-ivory group-hover:shadow-card">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage media={product.gallery?.[0] ?? null} alt={product.name} />
        </div>
      </div>
      <div className="text-h4 font-bold text-charcoal">{product.name}</div>
      {product.tagline ? (
        <div className="mt-1 text-small font-light text-stone">{product.tagline}</div>
      ) : null}
      {typeof product.basePriceRials === 'number' ? (
        <div className="mt-1 text-body font-light text-stone" dir="ltr">
          <MoneyDisplay rials={product.basePriceRials} />
        </div>
      ) : null}
    </a>
  );
}

function MiniCard({ product }: { product: PayloadProduct }) {
  return (
    <a
      href={productPath(product.slug)}
      className="grid grid-cols-[120px_1fr] items-center gap-4 rounded-md p-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-cream"
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        <PayloadImage media={product.gallery?.[0] ?? null} alt={product.name} />
      </div>
      <div>
        <div className="text-body font-bold text-charcoal">{product.name}</div>
        {product.tagline ? (
          <div className="mt-1 text-small font-light text-stone">{product.tagline}</div>
        ) : null}
        {typeof product.basePriceRials === 'number' ? (
          <div className="mt-1 text-small font-light text-stone" dir="ltr">
            <MoneyDisplay rials={product.basePriceRials} />
          </div>
        ) : null}
      </div>
    </a>
  );
}

export function ProductIndexHero({ products }: Props) {
  if (products.length === 0) return null;
  const [featured, ...rest] = products;
  if (!featured) return null;
  const minis = rest.slice(0, 3);

  return (
    <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      <FeaturedTile product={featured} />
      {/* Mobile: horizontal scroll strip with min-width per mini-card.
          Desktop: stacked column. */}
      <div className="flex flex-row gap-5 overflow-x-auto md:flex-col md:overflow-visible">
        {minis.map((p) => (
          <div key={p.id} className="min-w-[280px] flex-shrink-0 md:min-w-0">
            <MiniCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
