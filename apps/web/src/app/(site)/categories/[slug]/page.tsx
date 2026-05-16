import { notFound } from 'next/navigation';
import { Container, Breadcrumbs, Pagination } from '@zhic/ui';
import { CollectionHero } from '@/components/hero/CollectionHero';
import { ProductGrid } from '@/components/product/ProductGrid';
import { fetchCategory, fetchProducts, categoryPath } from '@/lib/payload';
import { buildMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const category = await fetchCategory(slug);
  return buildMetadata({
    seo: category?.seo,
    title: category?.name ?? 'دسته‌بندی',
    description: category?.description,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const [category, productsPage] = await Promise.all([
    fetchCategory(slug),
    fetchProducts({ category: slug, page }),
  ]);

  if (!category) notFound();

  const hrefForPage = (n: number) =>
    n <= 1 ? categoryPath(slug) : `${categoryPath(slug)}?page=${n}`;

  return (
    <>
      <CollectionHero eyebrow="دسته‌بندی" title={category.name} />

      <Container>
        <div className="pb-6">
          <Breadcrumbs items={[
            { label: 'خانه', href: '/' },
            { label: 'محصولات', href: '/products' },
            { label: category.name },
          ]} />
        </div>

        {category.description ? (
          <p className="mx-auto mb-[var(--space-8)] max-w-[680px] text-body leading-[1.85] text-stone">
            {category.description}
          </p>
        ) : null}

        <ProductGrid products={productsPage.docs} />

        <Pagination
          currentPage={productsPage.page}
          totalPages={productsPage.totalPages}
          hrefFor={hrefForPage}
        />
      </Container>

      <div className="pb-12" />
    </>
  );
}
