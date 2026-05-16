import { notFound } from 'next/navigation';
import { Container, Breadcrumbs } from '@zhic/ui';
import { DesignHero } from '@/components/design/DesignHero';
import { DesignStory } from '@/components/design/DesignStory';
import { DesignMoodboard } from '@/components/design/DesignMoodboard';
import { ProductGrid } from '@/components/product/ProductGrid';
import { fetchDesign, fetchProducts } from '@/lib/payload';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const design = await fetchDesign(slug);
  if (!design) return { title: 'یافت نشد' };
  return {
    title: design.name,
    description: design.tagline ?? `طرح ${design.name} — مبلمان دست‌ساز ژیک`,
    alternates: { canonical: `/designs/${design.slug}` },
    openGraph: {
      title: design.name,
      description: design.tagline ?? undefined,
      images: design.heroMedia?.url ? [{ url: design.heroMedia.url }] : undefined,
    },
  };
}

export default async function DesignDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [design, productsPage] = await Promise.all([
    fetchDesign(slug),
    fetchProducts({ design: slug, page: 1 }),
  ]);

  if (!design) {
    notFound();
  }

  const heroMedia = design.heroMedia ?? design.gallery?.[0] ?? null;
  const moodboardImages = design.gallery ?? [];

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: design.name }]} />
        </div>
      </Container>

      <DesignHero
        heroMedia={heroMedia}
        name={design.name}
        tagline={design.tagline ?? null}
        eyebrow="طرح"
      />

      <DesignStory blocks={design.storyBlocks ?? null} />

      <DesignMoodboard images={moodboardImages} />

      <Container>
        <section aria-label="مجموعه" className="pb-16">
          <p className="mb-5 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
            مجموعه
          </p>
          {productsPage.docs.length === 0 ? (
            <p className="py-9 text-center text-stone">به‌زودی محصولات این طرح اضافه می‌شود.</p>
          ) : (
            <ProductGrid products={productsPage.docs} />
          )}
        </section>
      </Container>
    </>
  );
}
