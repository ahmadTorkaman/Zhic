import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Container, Section } from '@zhic/ui';
import { fetchProduct } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { plainTextFromRichText, RichText } from '@/lib/richtext';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/jsonld';
import { ProductHeroImage, ProductThumbnails } from '@/components/products/ProductMediaStage';
import { ProductPurchasePanel } from '@/components/products/ProductPurchasePanel';
import { ProductRelatedRow } from '@/components/products/ProductRelatedRow';
import { ProductSpecsAccordion } from '@/components/products/ProductSpecsAccordion';

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
    openGraph: { type: 'website', title: product.name, description },
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
      {/* Sticky breadcrumb */}
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

      {/* Full-bleed cinematic 21:9 hero */}
      <ProductHeroImage gallery={product.gallery} />

      {/* Content + sidebar split */}
      <Section padY="lg" fullBleed>
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_380px]">
            {/* Content column */}
            <div>
              <ProductThumbnails gallery={product.gallery} />
              <h1 className="mb-4 text-h2 font-black text-ink">
                {product.name}
              </h1>
              {product.tagline ? (
                <p className="mb-6 text-lead font-light text-stone">
                  {product.tagline}
                </p>
              ) : null}
              {product.longDescription ? (
                <div className="mb-7 max-w-[560px] text-body leading-[1.85] text-charcoal">
                  <RichText value={product.longDescription} />
                </div>
              ) : null}
              <div className="border-t border-sand pt-6">
                <h2 className="mb-5 text-h4 font-bold text-charcoal">
                  مشخصات
                </h2>
                <ProductSpecsAccordion product={product} />
              </div>
            </div>

            {/* Sticky purchase sidebar (Task 5 will restyle the panel itself) */}
            <ProductPurchasePanel product={product} />
          </div>
        </Container>
      </Section>

      {/* Related products row (Task 5 will restyle) */}
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
