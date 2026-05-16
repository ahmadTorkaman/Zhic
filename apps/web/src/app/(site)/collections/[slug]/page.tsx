import { notFound } from 'next/navigation';
import { Container, Breadcrumbs } from '@zhic/ui';
import { CollectionHero } from '@/components/hero/CollectionHero';
import { ProductGrid } from '@/components/product/ProductGrid';
import { PayloadImage } from '@/components/PayloadImage';
import { RichText } from '@/lib/richtext';
import { fetchCollection } from '@/lib/payload';
import { buildMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const collection = await fetchCollection(slug);
  return buildMetadata({
    seo: collection?.seo,
    title: collection?.name ?? 'مجموعه',
    path: `/collections/${slug}`,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const collection = await fetchCollection(slug);
  if (!collection) notFound();

  const products = collection.products ?? [];

  return (
    <>
      <CollectionHero
        eyebrow="مجموعه"
        title={collection.name}
        image={collection.cover ? (
          <PayloadImage media={collection.cover} alt={collection.name} loading="eager" fetchPriority="high" />
        ) : undefined}
      />

      <Container>
        <div className="pb-6">
          <Breadcrumbs items={[
            { label: 'خانه', href: '/' },
            { label: 'محصولات', href: '/products' },
            { label: collection.name },
          ]} />
        </div>

        {collection.description ? (
          <div className="mx-auto mb-[var(--space-8)] max-w-[680px] text-body leading-[1.85] text-charcoal">
            <RichText value={collection.description} />
          </div>
        ) : null}

        <ProductGrid products={products} />
      </Container>

      <div className="pb-12" />
    </>
  );
}
