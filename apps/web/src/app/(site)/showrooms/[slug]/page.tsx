import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  Container,
  ImageGallery,
  Section,
  Stack,
} from '@zhic/ui';
import type { GalleryItem } from '@zhic/ui';
import { fetchShowroom, mediaUrl } from '@/lib/payload';
import type { PayloadShowroom } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { plainTextFromRichText, RichText } from '@/lib/richtext';
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/jsonld';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { ShowroomFeaturedProductsRow } from '@/components/showrooms/ShowroomFeaturedProductsRow';
import { ShowroomHero } from '@/components/showrooms/ShowroomHero';
import { ShowroomInfoCards } from '@/components/showrooms/ShowroomInfoCards';

function galleryItems(showroom: PayloadShowroom): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (const m of showroom.gallery ?? []) {
    const src = mediaUrl(m);
    if (!src) continue;
    items.push({ src, alt: m.alt ?? '', kind: 'image' });
  }
  return items;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const showroom = await fetchShowroom(slug);
  if (!showroom) return { title: 'شوروم یافت نشد' };
  const description =
    showroom.headline ??
    plainTextFromRichText(showroom.description) ??
    `شوروم ژیک در ${showroom.address?.city ?? 'ایران'}.`;
  return {
    title: showroom.name,
    description,
    alternates: { canonical: `/showrooms/${slug}` },
    openGraph: { type: 'website', title: showroom.name, description },
  };
}

export default async function ShowroomDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const showroom = await fetchShowroom(slug);
  if (!showroom) notFound();

  const items = galleryItems(showroom);
  const featured = showroom.featuredProductIds ?? [];

  const ldLocal = localBusinessJsonLd(showroom, SITE_URL);
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: 'شوروم‌ها', url: '/showrooms' },
      { name: showroom.name, url: `/showrooms/${showroom.slug}` },
    ],
    SITE_URL,
  );

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-sand/40 bg-ivory/90 backdrop-blur">
        <Container>
          <div className="py-3">
            <Breadcrumbs
              items={[
                { label: 'خانه', href: '/' },
                { label: 'شوروم‌ها', href: '/showrooms' },
                { label: showroom.name },
              ]}
            />
          </div>
        </Container>
      </div>

      <ShowroomHero showroom={showroom} />

      <Section padY="lg" fullBleed>
        <Container>
          <Stack gap="lg">
            {showroom.description ? (
              <div className="mx-auto max-w-[680px] text-body leading-[1.85] text-charcoal">
                <RichText value={showroom.description} />
              </div>
            ) : null}
            <ShowroomInfoCards showroom={showroom} />
          </Stack>
        </Container>
      </Section>

      {items.length > 0 ? (
        <Section padY="lg" bg="cream">
          <Container>
            <BlockReveal>
              <Stack gap="lg">
                <h2 className="text-h3 font-bold text-charcoal">گالری شوروم</h2>
                <ImageGallery items={items} layout="grid" columns={3} cellRatio="4/5" />
              </Stack>
            </BlockReveal>
          </Container>
        </Section>
      ) : null}

      <BlockReveal>
        <ShowroomFeaturedProductsRow products={featured} showroomName={showroom.name} />
      </BlockReveal>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldLocal) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
