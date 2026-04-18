import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import { fetchCollection } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { plainTextFromRichText } from '@/lib/richtext';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/jsonld';
import { CollectionHeader } from '@/components/collection/CollectionHeader';
import { ProductGrid } from '@/components/products/ProductGrid';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCollection(slug);
  if (!collection) return { title: 'مجموعه یافت نشد' };
  const description =
    plainTextFromRichText(collection.description) ?? 'مجموعه‌ی ژیک';
  return {
    title: collection.name,
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      type: 'website',
      title: collection.name,
      description,
    },
  };
}

export default async function CollectionDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await fetchCollection(slug);
  if (!collection) notFound();

  const products = collection.products ?? [];
  const description =
    plainTextFromRichText(collection.description) ?? undefined;

  const ldCollection = collectionPageJsonLd({
    name: collection.name,
    url: `${SITE_URL}/collections/${collection.slug}`,
    description,
  });
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: 'مجموعه‌ها', url: '/collections' },
      { name: collection.name, url: `/collections/${collection.slug}` },
    ],
    SITE_URL,
  );

  return (
    <>
      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: 'مجموعه‌ها' },
              { label: collection.name },
            ]}
          />
        </Container>
      </Section>

      <CollectionHeader collection={collection} />

      <Section padY="lg" fullBleed>
        <Container>
          <Stack gap="lg">
            <h2 className="text-h3 font-bold text-charcoal">
              قطعه‌های این مجموعه
            </h2>
            {products.length === 0 ? (
              <p className="text-body text-stone">
                این مجموعه فعلاً قطعه‌ای ندارد.
              </p>
            ) : (
              <ProductGrid products={products} />
            )}
          </Stack>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCollection) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
