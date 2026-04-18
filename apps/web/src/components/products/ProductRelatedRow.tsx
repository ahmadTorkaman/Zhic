import { Container, Section, MoneyDisplay } from '@zhic/ui';
import { productPath } from '@/lib/payload';
import type { PayloadProduct } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';

type Props = {
  products: PayloadProduct[];
  heading: string;
  bg?: 'transparent' | 'cream';
};

function RelatedTile({ product }: { product: PayloadProduct }) {
  return (
    <a
      href={productPath(product.slug)}
      className="group block transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:translate-y-[var(--hover-lift-card)]"
    >
      <div className="relative mb-3 aspect-square overflow-hidden bg-cream">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage media={product.gallery?.[0] ?? null} alt={product.name} />
        </div>
      </div>
      <div className="text-body font-bold text-charcoal">{product.name}</div>
      {typeof product.basePriceRials === 'number' ? (
        <div className="mt-1 text-small font-light text-stone" dir="ltr">
          <MoneyDisplay rials={product.basePriceRials} />
        </div>
      ) : null}
    </a>
  );
}

export function ProductRelatedRow({ products, heading, bg = 'transparent' }: Props) {
  if (products.length === 0) return null;
  return (
    <Section bg={bg} padY="xl" fullBleed>
      <Container>
        <h2 className="mb-6 text-h3 font-bold text-charcoal">{heading}</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {products.map((p) => (
            <RelatedTile key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
