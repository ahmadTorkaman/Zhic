import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import {
  fetchCategory,
  fetchProducts,
  fetchProductIdsByAxis,
  type PayloadCategory,
} from '@/lib/payload';
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
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTER_PARAM_KEYS = ['design', 'material', 'size', 'sort', 'page'] as const;

/**
 * Walk the category's parent chain and return the canonical slug sequence.
 * Used both for path validation AND for redirecting shallow URLs to their
 * canonical deep form (e.g. /bedroom-furniture/wall-mirror →
 * /bedroom-furniture/mirrors/wall-mirror).
 *
 * Depends on parent being inflated to depth >= chain length - 1.
 * fetchCategory uses depth=3 which covers the canonical tree's max
 * depth of 3 (bed/baby/convertible).
 */
function categoryCanonicalPath(category: PayloadCategory): string[] | null {
  const chain: string[] = [category.slug];
  let cur: PayloadCategory['parent'] = category.parent;
  while (cur != null) {
    if (typeof cur !== 'object') {
      // parent reference exists but not inflated — depth too shallow.
      // Refuse to validate rather than risk serving at the wrong URL.
      return null;
    }
    chain.unshift(cur.slug);
    cur = cur.parent;
  }
  return chain;
}

function parentPath(urlSlugs: string[]): string {
  if (urlSlugs.length <= 1) return '/bedroom-furniture';
  return '/bedroom-furniture/' + urlSlugs.slice(0, -1).join('/');
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slugs = raw.map(decodeURIComponent);
  const leafSlug = slugs.at(-1);
  if (!leafSlug) return { title: 'یافت نشد' };
  const sp = await searchParams;

  const category = await fetchCategory(leafSlug);
  if (!category) return { title: 'یافت نشد' };
  const canonicalChain = categoryCanonicalPath(category);
  if (canonicalChain == null) return { title: 'یافت نشد' };
  if (canonicalChain.join('/') !== slugs.join('/')) {
    // Shallow / mismatched URL — let the page handler redirect; here we still
    // return a sensible metadata so headless previews don't choke.
    return { title: category.name };
  }

  const hasFilterParams = FILTER_PARAM_KEYS.some(
    (k) => sp[k] !== undefined && sp[k] !== '',
  );

  const description =
    category.tagline ??
    deriveDescriptionFromIntro(category.intro) ??
    `${category.name} — مبلمان دست‌ساز ژیک`;

  const ogImageUrl = category.cover?.url ?? undefined;
  const canonicalPath = '/bedroom-furniture/' + slugs.join('/');

  const base = buildMetadata({
    seo: category.seo,
    title: category.name,
    description,
    image: ogImageUrl,
    path: canonicalPath,
  });

  if (hasFilterParams) {
    return {
      ...base,
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: true },
    };
  }

  return base;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug: raw } = await params;
  const slugs = raw.map(decodeURIComponent);
  const leafSlug = slugs.at(-1);
  if (!leafSlug) notFound();
  const sp = await searchParams;

  const category = await fetchCategory(leafSlug);
  if (!category) notFound();
  const canonicalChain = categoryCanonicalPath(category);
  if (canonicalChain == null) notFound();
  const canonicalPath = '/bedroom-furniture/' + canonicalChain.join('/');
  if (canonicalChain.join('/') !== slugs.join('/')) {
    // The URL is a valid leaf slug but at the wrong depth (e.g. someone
    // hit /bedroom-furniture/wall-mirror instead of the canonical
    // /bedroom-furniture/mirrors/wall-mirror). 308 to canonical — handles
    // the /categories/<leaf> → /bedroom-furniture/<leaf> redirect chain
    // from Phase 2 landing on a single-segment URL.
    redirect(canonicalPath);
  }

  const basePath = canonicalPath;

  // --- search-param parsing ---------------------------------------------------
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const design = typeof sp.design === 'string' ? sp.design : undefined;
  const materialParam = typeof sp.material === 'string' ? sp.material : undefined;
  const sortRaw = typeof sp.sort === 'string' ? sp.sort : 'newest';
  const sort: 'newest' | 'name' | 'priceAsc' | 'priceDesc' = (() => {
    if (sortRaw === 'price_asc') return 'priceAsc';
    if (sortRaw === 'price_desc') return 'priceDesc';
    if (sortRaw === 'name') return 'name';
    return 'newest';
  })();

  // --- mode determination -----------------------------------------------------
  // Pure parent → no own products, has children. Renders child grid.
  // Pure leaf → has products, no children.
  // Hybrid → has children AND has own products. Renders the narrow-down rail
  //          above the leaf-style grid.
  // Facet → category has axis_filter (Phase 1 schema). Auto-narrows the product
  //          query AND surfaces a scope indicator + locked-axis tag. Renders
  //          with leaf chrome.
  const childCats = await fetchChildCategories(category.id);
  const hasChildren = childCats.length > 0;
  const isFacet = category.axis_filter != null && typeof category.axis_filter === 'object';

  let facetProductIds: Array<string | number> | undefined;
  if (isFacet) {
    facetProductIds = await fetchProductIdsByAxis(
      category.axis_filter!.axis,
      category.axis_filter!.value,
    );
    // empty array → narrows to zero results (correct behavior; better than
    // silently falling back to the unfiltered set).
  }

  // ===========================================================================
  // PARENT BRANCH (no own products)
  // ===========================================================================
  if (hasChildren && !isFacet) {
    // Probe own product count to distinguish pure-parent from hybrid.
    const probe = await fetchProducts({ category: leafSlug, page: 1 });
    const hasOwnProducts = probe.totalDocs > 0;

    if (!hasOwnProducts) {
      const [designsWithType, siblings] = await Promise.all([
        fetchDesignsForParentCategory(leafSlug),
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
    // else: fall through to leaf branch with isHybrid=true
  }

  // ===========================================================================
  // LEAF / HYBRID / FACET BRANCH
  // ===========================================================================
  const parentRef =
    category.parent && typeof category.parent === 'object' ? category.parent : null;

  const [productsPage, designsWithType, siblings, availableDesigns, availableMaterials] =
    await Promise.all([
      fetchProducts({
        category: leafSlug,
        page,
        design,
        materials: materialParam ? [materialParam] : undefined,
        sort,
        productIds: facetProductIds,
      }),
      fetchDesignsForCategory(leafSlug),
      parentRef
        ? fetchSiblingCategories(parentRef.id, category.id)
        : Promise.resolve([] as PayloadCategory[]),
      fetchAvailableDesigns(leafSlug),
      fetchAvailableMaterials(leafSlug),
    ]);

  const fallbackCoverUrl = productsPage.docs[0]?.gallery?.[0]?.url ?? null;
  const isHybrid = hasChildren && !isFacet;

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

        {/* ★ FACET scope strip — between breadcrumb and layout grid.
            Per v1 mockup (category-facet-mockup.html). */}
        {isFacet && (
          <div
            role="status"
            aria-label="محدوده‌ی صفحه"
            className="mt-7 flex flex-wrap items-center gap-3.5 rounded border border-sand p-4"
            style={{ background: 'var(--color-cream)' }}
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: 'var(--color-forest)' }}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="10" rx="1.5" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                محدوده‌ی این صفحه
              </span>
              <span className="text-[14px] text-charcoal">
                فقط <strong className="font-bold text-ink">{category.name}</strong>{' '}
                — صفحه‌ی اختصاصی برای این پیکربندی
              </span>
            </div>
            {parentRef && (
              <a
                href={parentPath(slugs)}
                className="shrink-0 rounded-full border border-forest px-3.5 py-1.5 text-[12px] text-forest transition-colors hover:bg-forest hover:text-white"
              >
                همه‌ی {parentRef.name} ←
              </a>
            )}
          </div>
        )}

        {/* 2-col layout: [main | 280px sidebar] at lg+ */}
        <div className="mt-6 grid grid-cols-1 gap-0 lg:grid-cols-[1fr_280px] lg:gap-16">
          <main className="min-w-0">
            <CategoryIntro intro={category.intro} variant="leaf" />
            <CategoryCallouts callouts={callouts} variant="leaf" />

            {/* ★ HYBRID narrow-down rail — sub-category navigation between
                callouts and the result-bar. Per v1 mockup
                (category-hybrid-mockup.html). Distinct from filter chips
                (these navigate to facet sub-leaves, not filter the page). */}
            {isHybrid && (
              <section
                aria-label="پیکربندی‌های اختصاصی"
                className="mb-9 border-b border-sand pb-8"
              >
                <header className="mb-5 flex items-baseline gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                    ★ محدود کنید
                  </span>
                  <span className="text-[14px] font-bold text-charcoal">
                    {category.allowed_axes?.[0] ? `بر اساس ${category.allowed_axes[0]}` : 'صفحات اختصاصی'}
                  </span>
                  <span className="me-auto" />
                  <span className="text-[11px] italic text-stone">
                    یا پایین‌تر همه را ببینید
                  </span>
                </header>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
                  {childCats.map((child) => (
                    <a
                      key={child.id}
                      href={`${basePath}/${child.slug}`}
                      className="group relative flex flex-col gap-1 rounded p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                      style={{
                        background: 'var(--color-cream)',
                        border: '1px solid rgba(232, 224, 216, 0.55)',
                      }}
                    >
                      <span className="text-[13px] font-bold leading-tight text-ink">
                        {child.name}
                      </span>
                      {child.tagline && (
                        <span className="text-[11px] text-stone">{child.tagline}</span>
                      )}
                      <span
                        aria-hidden="true"
                        className="absolute end-3 top-3 text-[12px] text-sand-2 transition-colors group-hover:text-forest"
                      >
                        ←
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="text-[13px] text-stone">
                نمایش {toPersianDigits(productsPage.docs.length)} از{' '}
                {toPersianDigits(productsPage.totalDocs)}{' '}
                {isFacet ? category.name : 'محصول'}
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

            {parentRef && (
              <SiblingCategoriesStrip
                siblings={siblings}
                variant="leaf"
                parentName={isFacet ? `دیگر ${parentRef.name}` : parentRef.name}
                seeAllHref={parentPath(slugs)}
              />
            )}
          </main>

          <div className="lg:block">
            {/* ★ FACET locked-axis tag in sidebar — above the standard filter
                groups. Communicates the page's intrinsic filter without
                offering a deselect; "همه" link escapes to the parent leaf. */}
            {isFacet && (
              <div
                className="mb-5 hidden border-b border-sand pb-3 lg:block"
                aria-label="محور قفل‌شده"
              >
                <div className="flex items-center gap-2 text-[12px] text-stone">
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-forest"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="5" y="11" width="14" height="10" rx="1.5" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <span>این صفحه:</span>
                  <span className="font-bold text-ink">{category.name}</span>
                  {parentRef && (
                    <a
                      href={parentPath(slugs)}
                      className="ms-auto text-[11px] text-forest underline underline-offset-2"
                    >
                      همه
                    </a>
                  )}
                </div>
              </div>
            )}
            <CategoryFilterSidebar
              basePath={basePath}
              searchParams={sp}
              availableDesigns={availableDesigns}
              availableMaterials={availableMaterials}
            />
          </div>
        </div>
      </Container>

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
