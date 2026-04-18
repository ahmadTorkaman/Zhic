import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  Container,
  Section,
  Split,
  Stack,
} from '@zhic/ui';
import type { GalleryItem } from '@zhic/ui';
import { fetchProduct, mediaUrl } from '@/lib/payload';
import type { PayloadMedia } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { plainTextFromRichText, RichText } from '@/lib/richtext';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/jsonld';
import { ProductMediaStage } from '@/components/products/ProductMediaStage';
import { ProductPurchasePanel } from '@/components/products/ProductPurchasePanel';
import { ProductRelatedRow } from '@/components/products/ProductRelatedRow';
import { ProductSpecsAccordion } from '@/components/products/ProductSpecsAccordion';

const MOTION_MIME = /^(image\/gif|video\/)/i;

function partitionGallery(gallery: PayloadMedia[] | null | undefined) {
  const stills: GalleryItem[] = [];
  const motion: GalleryItem[] = [];
  for (const m of gallery ?? []) {
    const src = mediaUrl(m);
    if (!src) continue;
    const item: GalleryItem = {
      src,
      alt: m.alt ?? '',
      kind: m.mimeType && MOTION_MIME.test(m.mimeType) ? 'gif' : 'image',
    };
    if (item.kind === 'gif') motion.push(item);
    else stills.push(item);
  }
  return { stills, motion };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: 'محصول یافت نشد' };
  const description =
    product.shortDescription ??
    plainTextFromRichText(product.longDescription) ??
    'مبلمان دست‌ساز ژیک';
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
    },
  };
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const { stills, motion } = partitionGallery(product.gallery);

  const ldProduct = productJsonLd(product, SITE_URL);
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: 'محصولات', url: '/products' },
      { name: product.name, url: `/products/${product.slug}` },
    ],
    SITE_URL,
  );

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-sand/40 bg-ivory/90 backdrop-blur">
        <Container>
          <div className="py-3">
            <Breadcrumbs
              items={[
                { label: 'خانه', href: '/' },
                { label: 'محصولات', href: '/products' },
                { label: product.name },
              ]}
            />
          </div>
        </Container>
      </div>

      <Section padY="lg">
        <Container>
          <Split ratio="60/40" gap="xl">
            <ProductMediaStage stills={stills} motion={motion} />
            <ProductPurchasePanel product={product} />
          </Split>
        </Container>
      </Section>

      <Section padY="md" bg="cream">
        <Container>
          <Stack gap="lg">
            <h2 className="text-h2 font-bold text-charcoal">
              مشخصات
            </h2>
            <ProductSpecsAccordion product={product} />
          </Stack>
        </Container>
      </Section>

      {product.longDescription ? (
        <Section padY="lg">
          <Container>
            <Stack gap="md">
              <h2 className="text-h2 font-bold text-charcoal">
                درباره‌ی این قطعه
              </h2>
              <div className="max-w-prose">
                <RichText value={product.longDescription} />
              </div>
            </Stack>
          </Container>
        </Section>
      ) : null}

      <ProductRelatedRow
        products={product.relatedProductIds ?? []}
        heading="محصولات مرتبط"
      />
      <ProductRelatedRow
        products={product.pairsWithProductIds ?? []}
        heading="در کنار آن خوب است"
        bg="cream"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldProduct) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
