import { notFound } from 'next/navigation';
import { Container } from '@zhic/ui';
import { StickyBreadcrumb } from '@/components/layout/StickyBreadcrumb';
import { CinematicHero } from '@/components/hero/CinematicHero';
import { ProductThumbnails } from '@/components/product/ProductThumbnails';
import { ProductSidebar } from '@/components/product/ProductSidebar';
import { SpecsAccordion } from '@/components/product/SpecsAccordion';
import { PayloadImage } from '@/components/PayloadImage';
import { Tile } from '@/components/tile/Tile';
import { RichText } from '@/lib/richtext';
import { fetchProduct, productPath } from '@/lib/payload';
import { buildMetadata } from '@/lib/seo';
import { VariantSelectionProvider } from '@/components/product/VariantSelectionContext';
import { HeroImage } from '@/components/product/HeroImage';
import { InquiryHandler } from '@/components/product/InquiryHandler';
import { sortVariants } from '@/lib/variant-helpers';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await fetchProduct(slug);
  return buildMetadata({
    seo: product?.seo,
    title: product?.name ?? 'محصول',
    description: product?.shortDescription,
    path: `/products/${slug}`,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const crumbs = [
    { label: 'خانه', href: '/' },
    { label: 'محصولات', href: '/products' },
    { label: product.name },
  ];

  const gallery = product.gallery ?? [];
  const variants = sortVariants(product.variants ?? []);
  const firstVariant = variants[0] ?? null;
  const category = typeof product.categoryIds?.[0] === 'object' ? product.categoryIds[0] : null;
  const allowedAxes = category?.allowed_axes ?? [];

  // Specs are computed from product fields. The "ابعاد" row is left as
  // product-level; the picker handles the size axis. (If we want
  // selected-variant-aware dimensions on the spec row, we'd need a client
  // wrapper around the accordion — deferred to a follow-up.)
  const specs: { label: string; content: React.ReactNode }[] = [];

  if (product.dimensions) {
    const parts: string[] = [];
    if (product.dimensions.width) parts.push(`عرض: ${product.dimensions.width} سانتی‌متر`);
    if (product.dimensions.depth) parts.push(`عمق: ${product.dimensions.depth} سانتی‌متر`);
    if (product.dimensions.height) parts.push(`ارتفاع: ${product.dimensions.height} سانتی‌متر`);
    if (parts.length) {
      specs.push({ label: 'ابعاد', content: <span dir="ltr">{parts.join(' · ')}</span> });
    }
  }
  if (product.materialIds?.length) {
    specs.push({ label: 'متریال', content: product.materialIds.map((m) => m.name).join(' · ') });
  }
  if (product.specs) {
    specs.push({ label: 'مشخصات فنی', content: <RichText value={product.specs} /> });
  }

  return (
    <VariantSelectionProvider variants={variants} initialVariant={firstVariant}>
      <StickyBreadcrumb items={crumbs} />

      <CinematicHero image={<HeroImage product={product} />} />

      <Container>
        <div className="grid grid-cols-1 gap-[var(--space-8)] pb-9 lg:grid-cols-[1fr_320px]">
          <div>
            {gallery.length > 1 ? (
              <div className="mb-7">
                <ProductThumbnails images={gallery} activeIndex={0} />
              </div>
            ) : null}
            <h1 className="mb-4 text-h2 font-black text-ink">{product.name}</h1>
            {product.tagline ? <p className="mb-6 text-lead font-light text-stone">{product.tagline}</p> : null}
            {product.shortDescription ? (
              <p className="mb-7 max-w-[560px] text-body leading-[1.85] text-charcoal">{product.shortDescription}</p>
            ) : null}
            {product.longDescription ? (
              <div className="mb-7 max-w-[560px] text-body leading-[1.85] text-charcoal">
                <RichText value={product.longDescription} />
              </div>
            ) : null}
            {specs.length > 0 ? (
              <div className="mt-7 border-t border-sand pt-6">
                <h2 className="mb-5 text-h4 font-bold text-charcoal">مشخصات</h2>
                <SpecsAccordion specs={specs} />
              </div>
            ) : null}
          </div>
          <aside>
            <ProductSidebar product={product} />
          </aside>
        </div>

        {/* Related products */}
        {product.relatedProductIds && product.relatedProductIds.length > 0 ? (
          <section className="border-t border-sand py-9">
            <h2 className="mb-6 text-h3 font-bold text-ink">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 gap-[var(--space-5)] md:grid-cols-4">
              {product.relatedProductIds.slice(0, 4).map((rp) => (
                <Tile
                  key={String(rp.id)}
                  href={productPath(rp.slug)}
                  image={<PayloadImage media={rp.gallery?.[0] ?? null} alt={rp.name} fallbackText="تصویر" />}
                  aspect="4/5"
                  title={rp.name}
                  price={rp.basePriceRials ?? undefined}
                  hover="full"
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <div className="pb-[calc(var(--picker-h,76px)+24px)]" />

      <InquiryHandler product={product} variants={variants} allowedAxes={allowedAxes} />
    </VariantSelectionProvider>
  );
}
