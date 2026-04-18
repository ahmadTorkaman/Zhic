import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import {
  fetchCategories,
  fetchMaterials,
  fetchProducts,
  PRODUCTS_PER_PAGE,
} from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import {
  applyClientSizeBand,
  parseSearchParams,
  type SearchParamsRecord,
} from '@/lib/products';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/jsonld';
import { Pagination } from '@/components/products/Pagination';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductFilterPills } from '@/components/products/ProductFilterPills';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductIndexEmpty } from '@/components/products/ProductIndexEmpty';
import { ProductIndexHero } from '@/components/products/ProductIndexHero';
import { ProductIndexToolbar } from '@/components/products/ProductIndexToolbar';

const PAGE_TITLE = 'محصولات';
const PAGE_DESCRIPTION =
  'مجموعه‌ی مبلمان دست‌ساز ژیک — تخت‌خواب، کمد، دراور و آینه با چوب گردو، بلوط و راش.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/products' },
  openGraph: { type: 'website', title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

export default async function ProductsIndex({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const sp = await searchParams;
  const query = parseSearchParams(sp);

  const [page, categories, materials] = await Promise.all([
    fetchProducts(query),
    fetchCategories(),
    fetchMaterials(),
  ]);

  const visible = applyClientSizeBand(page.docs, query.size);
  const sizeFilterReducedCount =
    query.size && visible.length !== page.docs.length;
  const totalDocs = sizeFilterReducedCount ? visible.length : page.totalDocs;
  const totalPages = sizeFilterReducedCount
    ? Math.max(1, Math.ceil(visible.length / PRODUCTS_PER_PAGE))
    : page.totalPages;

  const drawerFilters = (
    <ProductFilters
      categories={categories}
      materials={materials}
      query={query}
      action="/products"
    />
  );

  // Hero only on page 1 with no filters applied
  const showHero =
    (query.page ?? 1) === 1 &&
    !query.category &&
    (!query.materials || query.materials.length === 0) &&
    !query.size &&
    !query.price;
  const heroProducts = showHero ? visible.slice(0, 4) : [];

  const collectionLd = collectionPageJsonLd({
    name: PAGE_TITLE,
    url: `${SITE_URL}/products`,
    description: PAGE_DESCRIPTION,
  });
  const breadcrumbLd = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: PAGE_TITLE, url: '/products' },
    ],
    SITE_URL,
  );

  return (
    <>
      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[{ label: 'خانه', href: '/' }, { label: PAGE_TITLE }]}
          />
        </Container>
      </Section>
      <Section padY="sm">
        <Container>
          <Stack gap="lg">
            <h1 className="text-h2 font-black text-ink">{PAGE_TITLE}</h1>

            {showHero && heroProducts.length > 0 ? (
              <ProductIndexHero products={heroProducts} />
            ) : null}

            <ProductFilterPills
              categories={categories}
              materials={materials}
              query={query}
              action="/products"
            />

            <ProductIndexToolbar
              totalDocs={totalDocs}
              query={query}
              drawerContent={drawerFilters}
            />

            {visible.length === 0 ? (
              <ProductIndexEmpty resetHref="/products" />
            ) : (
              <>
                <ProductGrid products={visible} />
                <Pagination
                  currentPage={query.page ?? 1}
                  totalPages={totalPages}
                  basePath="/products"
                  searchParams={sp}
                />
              </>
            )}
          </Stack>
        </Container>
      </Section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
