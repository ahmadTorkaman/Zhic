import { Container, Grid, ProductCard, Section, Stack } from '@zhic/ui';
import { productPath } from '@/lib/payload';
import type { PayloadProduct } from '@/lib/payload';
import { PayloadImage } from '@/components/PayloadImage';

type Props = {
  products: PayloadProduct[];
  heading: string;
  bg?: 'transparent' | 'cream';
};

export function ProductRelatedRow({ products, heading, bg = 'transparent' }: Props) {
  if (products.length === 0) return null;
  return (
    <Section bg={bg} padY="lg">
      <Container>
        <Stack gap="lg">
          <h2 className="text-h2 font-bold text-charcoal">{heading}</h2>
          <Grid columns={4} gap="md">
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
              />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
