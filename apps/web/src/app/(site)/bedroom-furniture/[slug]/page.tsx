import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import { fetchCategory, fetchProducts } from '@/lib/payload';
import {
  fetchChildCategories,
  fetchSiblingCategories,
  fetchSiblingParents,
  fetchDesignsForCategory,
  fetchDesignsForParentCategory,
  fetchAvailableDesigns,
  fetchAvailableMaterials,
} from '@/lib/category-fetchers';
import { buildCrumbs, deriveDescriptionFromIntro, countActiveFilters } from '@/lib/category-helpers';
import { buildMetadata } from '@/lib/seo';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryHero } from '@/components/category/CategoryHero';
import { CategoryIntro } from '@/components/category/CategoryIntro';
import { CategoryCallouts, type Callout } from '@/components/category/CategoryCallouts';
import { ChildCategoriesGrid } from '@/components/category/ChildCategoriesGrid';
import { DesignsWithType } from '@/components/category/DesignsWithType';
import { SiblingCategoriesStrip } from '@/components/category/SiblingCategoriesStrip';
import { CategoryFilterSidebar } from '@/components/category/CategoryFilterSidebar';
import { CategoryFilterProvider } from '@/components/category/category-filter-state';
import { CategoryFilterTrigger } from '@/components/category/CategoryFilterTrigger';
import { CategoryFilterSheet } from '@/components/category/CategoryFilterSheet';
import { buildFilterHref } from '@/lib/category-filter-url';
import { categoryCollectionPageLd, breadcrumbListLd } from '@/lib/category-jsonld';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Keys that, when present, indicate a filtered (non-canonical) URL.
const FILTER_PARAM_KEYS = ['design', 'material', 'size', 'sort', 'page'] as const;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;

  const category = await fetchCategory(slug);
  if (!category) return { title: 'یافت نشد' };

  const hasFilterParams = FILTER_PARAM_KEYS.some(
    (k) => sp[k] !== undefined && sp[k] !== '',
  );

  const description =
    category.tagline ??
    deriveDescriptionFromIntro(category.intro) ??
    `${category.name} — مبلمان دست‌ساز ژیک`;

  const ogImageUrl = category.cover?.url ?? undefined;

  // Always canonical to the base (no filter params).
  const base = buildMetadata({
    seo: category.seo,
    title: category.name,
    description,
    image: ogImageUrl,
    path: `/bedroom-furniture/${slug}`,
  });

  if (hasFilterParams) {
    // Override robots to noindex,follow for filtered URLs.
    // buildMetadata only ever sets noindex,follow=false — so we patch manually.
    return {
      ...base,
      alternates: { canonical: `/bedroom-furniture/${slug}` },
      robots: { index: false, follow: true },
    };
  }

  return base;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const sp = await searchParams;

  const category = await fetchCategory(slug);
  if (!category) notFound();

  const isLeaf = category.parent != null && typeof category.parent === 'object';
  const basePath = `/bedroom-furniture/${slug}`;

  // --- Search-param parsing ---------------------------------------------------
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const design = typeof sp.design === 'string' ? sp.design : undefined;
  const materialParam = typeof sp.material === 'string' ? sp.material : undefined;
  const sortRaw = typeof sp.sort === 'string' ? sp.sort : 'newest';
  // Normalise URL-param sort keys to the values fetchProducts accepts.
  // URL uses price_asc / price_desc; fetchProducts expects priceAsc / priceDesc.
  const sort: 'newest' | 'name' | 'priceAsc' | 'priceDesc' = (() => {
    if (sortRaw === 'price_asc') return 'priceAsc';
    if (sortRaw === 'price_desc') return 'priceDesc';
    if (sortRaw === 'name') return 'name';
    return 'newest';
  })();

  // ===========================================================================
  // LEAF BRANCH
  // ===========================================================================
  if (isLeaf) {
    const parent = category.parent as NonNullable<typeof category.parent> & {
      id: string | number;
      name: string;
      slug: string;
    };

    const [productsPage, designsWithType, siblings, availableDesigns, availableMaterials] =
      await Promise.all([
        fetchProducts({
          category: slug,
          page,
          design,
          materials: materialParam ? [materialParam] : undefined,
          sort,
        }),
        fetchDesignsForCategory(slug),
        fetchSiblingCategories(parent.id, category.id),
        fetchAvailableDesigns(slug),
        fetchAvailableMaterials(slug),
      ]);

    const fallbackCoverUrl = productsPage.docs[0]?.gallery?.[0]?.url ?? null;

    const callouts: Callout[] = [
      { num: toPersianDigits(productsPage.totalDocs), lbl: 'محصول' },
      { num: toPersianDigits(designsWithType.length), lbl: 'طرح' },
      { num: toPersianDigits(availableMaterials.length), lbl: 'روکش چوب' },
    ];

    const activeCount = countActiveFilters(sp);

    return (
      <CategoryFilterProvider>
        <CategoryHero category={category} fallbackCoverUrl={fallbackCoverUrl} />

        <Container>
          <div className="pb-4 pt-6">
            <Breadcrumbs items={buildCrumbs(category)} />
          </div>

          {/* 2-column layout: [main | 280px sidebar] at lg+ */}
          <div className="mt-6 grid grid-cols-1 gap-0 lg:grid-cols-[1fr_280px] lg:gap-16">
            <main className="min-w-0">
              <CategoryIntro intro={category.intro} variant="leaf" />
              <CategoryCallouts callouts={callouts} variant="leaf" />

              {/* Result bar */}
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-[13px] text-stone">
                  نمایش {toPersianDigits(productsPage.docs.length)} از {toPersianDigits(productsPage.totalDocs)} محصول
                </span>
              </div>

              {productsPage.docs.length === 0 ? (
                <p className="py-10 text-center text-stone">
                  هیچ محصولی با این فیلترها یافت نشد.{' '}
                  <a href={basePath} className="text-forest underline underline-offset-4">
                    پاک کردن فیلترها
                  </a>
                </p>
              ) : (
                <ProductGrid products={productsPage.docs} />
              )}

              {productsPage.totalPages > 1 && (
                <Pagination
                  currentPage={productsPage.page}
                  totalPages={productsPage.totalPages}
                  hrefFor={(n) => buildFilterHref(basePath, sp, { page: n })}
                />
              )}

              <DesignsWithType
                designs={designsWithType}
                contextLabel={category.name}
                eyebrow="★ این نوع در"
              />

              <SiblingCategoriesStrip
                siblings={siblings}
                variant="leaf"
                parentName={parent.name}
                seeAllHref={`/bedroom-furniture/${parent.slug}`}
              />
            </main>

            {/* Sticky filter sidebar — hidden on mobile (lg:block via CSS module) */}
            <CategoryFilterSidebar
              basePath={basePath}
              searchParams={sp}
              availableDesigns={availableDesigns}
              availableMaterials={availableMaterials}
            />
          </div>
        </Container>

        {/* Mobile: fixed pill trigger + bottom-sheet drawer */}
        <CategoryFilterTrigger activeCount={activeCount} />
        <CategoryFilterSheet
          basePath={basePath}
          searchParams={sp}
          availableDesigns={availableDesigns}
          availableMaterials={availableMaterials}
        />

        <div className="pb-12" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryCollectionPageLd(category)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListLd(buildCrumbs(category))) }}
        />
      </CategoryFilterProvider>
    );
  }

  // ===========================================================================
  // PARENT BRANCH
  // ===========================================================================
  const [childCats, designsWithType, siblings] = await Promise.all([
    fetchChildCategories(category.id),
    fetchDesignsForParentCategory(slug),
    fetchSiblingParents(category.id),
  ]);

  const callouts: Callout[] = [
    { num: toPersianDigits(childCats.length), lbl: 'زیرنوع' },
    { num: toPersianDigits(designsWithType.length), lbl: 'طرح' },
  ];

  return (
    <>
      <CategoryHero category={category} />

      <Container>
        <div className="pb-4 pt-6">
          <Breadcrumbs items={buildCrumbs(category)} />
        </div>

        <main className="mt-6">
          <CategoryIntro intro={category.intro} variant="parent" />
          <CategoryCallouts callouts={callouts} variant="parent" />

          <ChildCategoriesGrid items={childCats} />

          <DesignsWithType
            designs={designsWithType}
            contextLabel={category.name}
            eyebrow="★ این دسته در"
          />

          <SiblingCategoriesStrip siblings={siblings} variant="parent" />
        </main>
      </Container>

      <div className="pb-12" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryCollectionPageLd(category)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListLd(buildCrumbs(category))) }}
      />
    </>
  );
}
