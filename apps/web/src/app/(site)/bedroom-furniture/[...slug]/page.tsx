import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@zhic/ui';
import {
  fetchCategory,
  fetchProducts,
  fetchProductIdsByAxis,
  type PayloadCategory,
} from '@/lib/payload';
import {
  fetchChildCategories,
  fetchChildTilePhotos,
  fetchAvailableDesigns,
  fetchAvailableMaterials,
  fetchDesignsForCategory,
  fetchDesignsForParentCategory,
  fetchSiblingCategories,
  fetchSiblingParents,
} from '@/lib/category-fetchers';
import { buildCrumbs, deriveDescriptionFromIntro } from '@/lib/category-helpers';
import { buildMetadata } from '@/lib/seo';
import { buildFilterHref } from '@/lib/category-filter-url';
import { categoryCollectionPageLd, breadcrumbListLd } from '@/lib/category-jsonld';
import { buildMosaicRows } from '@/lib/bedroom-furniture-mosaic';
import { hubContentFromPayload } from '@/lib/category-hub-content';
import { leafContentFromPayload } from '@/lib/leaf-content';
import { MosaicHero } from '@/components/bedroom-furniture-mosaic/MosaicHero';
import { CategoryMosaic } from '@/components/bedroom-furniture-mosaic/CategoryMosaic';
import { ProductMosaic } from '@/components/bedroom-furniture-mosaic/ProductMosaic';
import { MosaicPager } from '@/components/bedroom-furniture-mosaic/MosaicPager';
import {
  MosaicFilterBar,
  type ConfigGroup,
} from '@/components/bedroom-furniture-mosaic/MosaicFilterBar';
import { MosaicStrip, type StripItem } from '@/components/bedroom-furniture-mosaic/MosaicStrip';

type DesignLike = {
  slug: string;
  name: string;
  heroMedia?: { url?: string | null } | null;
  sliderMedia?: { url?: string | null } | null;
  gallery?: ({ url?: string | null } | null)[] | null;
};

/** designs → cross-link strip tiles (photo from hero/slider/gallery). */
function designStripItems(designs: DesignLike[]): StripItem[] {
  return designs.map((d) => ({
    key: d.slug,
    name: d.name,
    img: d.heroMedia?.url ?? d.sliderMedia?.url ?? d.gallery?.[0]?.url ?? undefined,
    href: `/bedroom-set/${d.slug}`,
    eyebrow: 'طرح',
  }));
}

/** sibling categories → strip tiles (photo from cover ?? a representative product). */
function siblingStripItems(
  siblings: PayloadCategory[],
  photos: Map<string, string>,
  basePrefix: string,
): StripItem[] {
  return siblings.map((s) => ({
    key: s.slug,
    name: s.name,
    img: s.cover?.url ?? photos.get(s.slug) ?? undefined,
    href: `${basePrefix}/${s.slug}`,
  }));
}

const LEAF_SORT_OPTIONS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'name', label: 'نام' },
];

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
  // Facet → category has axisFilter (Phase 1 schema). Auto-narrows the product
  //          query AND surfaces a scope indicator + locked-axis tag. Renders
  //          with leaf chrome.
  const childCats = await fetchChildCategories(category.id);
  const hasChildren = childCats.length > 0;
  const isFacet = category.axisFilter != null && typeof category.axisFilter === 'object';

  let facetProductIds: Array<string | number> | undefined;
  if (isFacet) {
    facetProductIds = await fetchProductIdsByAxis(
      category.axisFilter!.axis,
      category.axisFilter!.value,
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
      // Hub mosaic (Kaveh 334:105 language): children → adaptive tile mosaic,
      // each tile photo = cover ?? a representative product in its subtree.
      const photos = await fetchChildTilePhotos(childCats);
      const hub = hubContentFromPayload(category, childCats, photos, canonicalPath);

      const [designsWithType, siblingParents] = await Promise.all([
        fetchDesignsForParentCategory(leafSlug),
        fetchSiblingParents(category.id),
      ]);
      const siblingPhotos = await fetchChildTilePhotos(siblingParents);
      const designItems = designStripItems(designsWithType);
      const siblingItems = siblingStripItems(siblingParents, siblingPhotos, '/bedroom-furniture');

      return (
        <>
          <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
            <div className="px-4 pt-[calc(var(--header-height)+var(--space-5))]">
              <Breadcrumbs items={buildCrumbs(category)} />
            </div>
            <div className="mt-[34px]">
              <MosaicHero
                title={hub.hero.title}
                subtitle={hub.hero.subtitle}
                tagline={hub.hero.tagline}
              />
            </div>
            <div className="mt-[26px]">
              <CategoryMosaic heading={hub.heading} rows={buildMosaicRows(hub.tiles)} />
            </div>
            {designItems.length > 0 && (
              <div className="mt-[40px]">
                <MosaicStrip heading="طرح‌های مرتبط" items={designItems} />
              </div>
            )}
            {siblingItems.length > 0 && (
              <div className="mt-[36px]">
                <MosaicStrip heading="دیگر دسته‌ها" items={siblingItems} />
              </div>
            )}
          </div>
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

  const [productsPage, availableDesigns, availableMaterials, designsWithType, siblings] =
    await Promise.all([
      fetchProducts({
        category: leafSlug,
        page,
        design,
        materials: materialParam ? [materialParam] : undefined,
        sort,
        productIds: facetProductIds,
      }),
      fetchAvailableDesigns(leafSlug),
      fetchAvailableMaterials(leafSlug),
      fetchDesignsForCategory(leafSlug),
      parentRef
        ? fetchSiblingCategories(parentRef.id, category.id)
        : Promise.resolve([] as PayloadCategory[]),
    ]);
  const siblingPhotos = await fetchChildTilePhotos(siblings);

  const leaf = leafContentFromPayload(category, productsPage.docs, productsPage.totalDocs);
  const designItems = designStripItems(designsWithType);
  const parentBase =
    canonicalChain.length > 1
      ? '/bedroom-furniture/' + canonicalChain.slice(0, -1).join('/')
      : '/bedroom-furniture';
  const siblingItems = siblingStripItems(siblings, siblingPhotos, parentBase);

  // Configuration selector for hybrid / facet pages → drives the existing
  // variant sub-pages from inside the filter sheet (operator: navigate-to-page).
  let configGroup: ConfigGroup | undefined;
  if (isFacet && parentRef) {
    const parentChildren = await fetchChildCategories(parentRef.id);
    if (parentChildren.length > 0) {
      configGroup = {
        label: 'پیکربندی',
        parentHref: parentBase,
        active: category.slug,
        options: parentChildren.map((c) => ({
          value: c.slug,
          label: c.name,
          href: `${parentBase}/${c.slug}`,
        })),
      };
    }
  } else if (hasChildren && childCats.length > 0) {
    configGroup = {
      label: 'پیکربندی',
      parentHref: basePath,
      active: null,
      options: childCats.map((c) => ({
        value: c.slug,
        label: c.name,
        href: `${basePath}/${c.slug}`,
      })),
    };
  }

  const filterGroups = [
    {
      key: 'design' as const,
      label: 'طرح',
      options: availableDesigns.map((d) => ({ value: d.slug, label: d.name, count: d.count })),
    },
    {
      key: 'material' as const,
      label: 'روکش چوب',
      options: availableMaterials.map((m) => ({ value: m.slug, label: m.name, count: m.count })),
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <div className="px-4 pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={buildCrumbs(category)} />
        </div>

        <div className="mt-[34px]">
          <MosaicHero
            title={leaf.hero.title}
            subtitle={leaf.hero.subtitle}
            tagline={leaf.hero.tagline}
          />
        </div>

        <div className="mt-[22px]">
          <MosaicFilterBar
            basePath={basePath}
            searchParams={sp}
            sortOptions={LEAF_SORT_OPTIONS}
            activeSort={sortRaw}
            groups={filterGroups}
            active={{ design, material: materialParam }}
            config={configGroup}
          />
        </div>

        <div className="mt-[18px]">
          {leaf.products.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[15px] text-stone">محصولی با این انتخاب پیدا نشد.</p>
              <a
                href={isFacet ? parentBase : basePath}
                className="mt-4 inline-block text-[13px] text-gold underline underline-offset-4"
              >
                {isFacet ? `مشاهده‌ی همه‌ی ${parentRef?.name ?? 'دسته'} ←` : 'پاک کردن فیلترها ←'}
              </a>
            </div>
          ) : (
            <ProductMosaic heading={leaf.heading} products={leaf.products} />
          )}
        </div>

        {productsPage.totalPages > 1 && (
          <div className="mt-9">
            <MosaicPager
              currentPage={productsPage.page}
              totalPages={productsPage.totalPages}
              hrefFor={(n) => buildFilterHref(basePath, sp, { page: n })}
            />
          </div>
        )}

        {designItems.length > 0 && (
          <div className="mt-[44px]">
            <MosaicStrip heading="طرح‌های مرتبط" items={designItems} />
          </div>
        )}
        {siblingItems.length > 0 && (
          <div className="mt-[36px]">
            <MosaicStrip
              heading={`دیگر ${parentRef?.name ?? 'دسته‌ها'}`}
              items={siblingItems}
            />
          </div>
        )}
      </div>

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
