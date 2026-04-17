import { Grid, ProductCard } from '@zhic/ui';
import { productPath } from '@/lib/payload';
import type { PayloadProduct } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';

type Props = {
  products: PayloadProduct[];
};

export function ProductGrid({ products }: Props) {
  return (
    <Grid columns={3} gap="lg">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          href={productPath(p.slug)}
          name={p.name}
          tagline={p.tagline ?? undefined}
          image={<PayloadImage media={p.gallery?.[0] ?? null} alt={p.name} />}
          priceRials={p.basePriceRials ?? undefined}
          availability={p.availability ?? undefined}
          leadTimeDays={p.leadTimeDays ?? undefined}
          materials={p.materialIds?.map((m) => m.name) ?? undefined}
        />
      ))}
    </Grid>
  );
}
