import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Button, Container, Section, Stack } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { fetchCategory, fetchProducts } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/jsonld';
import { ProductGrid } from '@/components/products/ProductGrid';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) return { title: 'دسته‌بندی یافت نشد' };
  return {
    title: category.name,
    description: category.description ?? undefined,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      type: 'website',
      title: category.name,
      description: category.description ?? undefined,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, result] = await Promise.all([
    fetchCategory(slug),
    fetchProducts({ category: slug }),
  ]);

  if (!category) notFound();

  const ldCrumbs = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: category.name, url: `/categories/${category.slug}` },
    ],
    SITE_URL,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionPageJsonLd({
              name: category.name,
              url: `${SITE_URL}/categories/${category.slug}`,
              description: category.description ?? undefined,
            }),
          ),
        }}
      />

      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: category.name },
            ]}
          />
        </Container>
      </Section>

      <Section padY="lg" fullBleed>
        <Container>
          <Stack gap="lg">
            <div>
              <h1 className="text-h1 font-black text-ink text-balance">
                {category.name}
              </h1>
              {category.description ? (
                <p className="mt-3 max-w-[520px] text-lead font-light text-stone">
                  {category.description}
                </p>
              ) : null}
            </div>

            {result.docs.length > 0 ? (
              <BlockReveal>
                <Stack gap="lg">
                  <ProductGrid products={result.docs} />
                  <div className="flex justify-center pt-4">
                    <Button
                      as="a"
                      href={`/products?category=${category.slug}`}
                      variant="ghost"
                    >
                      مشاهده‌ی همه‌ی {category.name} در فروشگاه
                    </Button>
                  </div>
                </Stack>
              </BlockReveal>
            ) : (
              <p className="py-8 text-center text-body text-stone">
                هنوز محصولی در این دسته‌بندی اضافه نشده است.
              </p>
            )}
          </Stack>
        </Container>
      </Section>
    </>
  );
}
