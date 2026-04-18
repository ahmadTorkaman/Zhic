import { Container, Grid, ProductCard, Section, Stack } from '@zhic/ui';
import type { PayloadProduct } from '@/lib/payload';
import { mediaUrl, productPath } from '@/lib/payload';

function ProductCover({ product }: { product: PayloadProduct }) {
  const firstImage = product.gallery?.[0];
  const src = firstImage ? mediaUrl(firstImage) : null;
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        تصویر به‌زودی
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={firstImage?.alt ?? product.name}
      className="h-full w-full object-cover"
    />
  );
}

export function RelatedProducts({
  products,
  heading = 'محصولات معرفی‌شده',
}: {
  products: PayloadProduct[];
  heading?: string;
}) {
  if (products.length === 0) return null;

  return (
    <Section padY="md">
      <Container>
        <Stack gap="md">
          <h2 className="text-h3 font-bold text-charcoal">{heading}</h2>
          <Grid columns={3} gap="lg">
            {products.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                href={productPath(product.slug)}
                name={product.name}
                tagline={product.tagline ?? undefined}
                priceRials={product.basePriceRials ?? undefined}
                image={<ProductCover product={product} />}
              />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
