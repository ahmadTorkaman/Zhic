import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { ProductIndexHero } from '@/components/product/ProductIndexHero';
import { ProductFilterPills } from '@/components/product/ProductFilterPills';
import { ProductIndexToolbar, type ProductSort } from '@/components/product/ProductIndexToolbar';
import { ProductGrid } from '@/components/product/ProductGrid';
import {
  fetchProducts,
  fetchCategories,
  fetchMaterials,
  type ProductsQuery,
} from '@/lib/payload';

const SORT_TO_UI: Record<NonNullable<ProductsQuery['sort']>, ProductSort> = {
  newest: 'newest',
  name: 'name',
  priceAsc: 'price_asc',
  priceDesc: 'price_desc',
};

const SORT_TO_QUERY: Record<ProductSort, NonNullable<ProductsQuery['sort']>> = {
  newest: 'newest',
  name: 'name',
  price_asc: 'priceAsc',
  price_desc: 'priceDesc',
};

export function generateMetadata() {
  return { title: 'محصولات' };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const category = typeof sp.cat === 'string' ? sp.cat : undefined;
  const material = typeof sp.mat === 'string' ? sp.mat : undefined;
  const sort = (typeof sp.sort === 'string' &&
    ['newest', 'name', 'priceAsc', 'priceDesc'].includes(sp.sort))
    ? (sp.sort as NonNullable<ProductsQuery['sort']>)
    : 'newest';

  const [productsPage, categories, materials] = await Promise.all([
    fetchProducts({ page, category, materials: material ? [material] : undefined, sort }),
    fetchCategories(),
    fetchMaterials(),
  ]);

  function buildHref(overrides: {
    cat?: string | null;
    mat?: string | null;
    sort?: NonNullable<ProductsQuery['sort']>;
    page?: number;
  }): string {
    const params = new URLSearchParams();
    const nextCat = overrides.cat === undefined ? category : (overrides.cat ?? undefined);
    const nextMat = overrides.mat === undefined ? material : (overrides.mat ?? undefined);
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? 1;
    if (nextCat) params.set('cat', nextCat);
    if (nextMat) params.set('mat', nextMat);
    if (nextSort !== 'newest') params.set('sort', nextSort);
    if (nextPage > 1) params.set('page', String(nextPage));
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  }

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'محصولات' }]} />
        </div>
        <div className="mb-7 mt-4">
          <h1 className="text-h1 font-black text-ink">محصولات</h1>
        </div>

        {page === 1 && !category && !material ? (
          <div className="mb-8">
            <ProductIndexHero products={productsPage.docs.slice(0, 4)} />
          </div>
        ) : null}

        <ProductFilterPills
          activeCategory={category ?? null}
          activeMaterial={material ?? null}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          materials={materials.map((m) => ({ name: m.name, slug: m.slug }))}
          categoryHref={(slug) => buildHref({ cat: slug, page: 1 })}
          materialHref={(slug) => buildHref({ mat: slug, page: 1 })}
        />

        <ProductIndexToolbar
          totalCount={productsPage.totalDocs}
          currentSort={SORT_TO_UI[sort]}
          sortHrefs={{
            newest: buildHref({ sort: 'newest', page: 1 }),
            name: buildHref({ sort: 'name', page: 1 }),
            price_asc: buildHref({ sort: 'priceAsc', page: 1 }),
            price_desc: buildHref({ sort: 'priceDesc', page: 1 }),
          }}
        />

        <ProductGrid
          products={
            page === 1 && !category && !material
              ? productsPage.docs.slice(4)
              : productsPage.docs
          }
        />

        <Pagination
          currentPage={productsPage.page}
          totalPages={productsPage.totalPages}
          hrefFor={(n) => buildHref({ page: n })}
        />
      </Container>

      <div className="pb-12" />
    </>
  );
}
