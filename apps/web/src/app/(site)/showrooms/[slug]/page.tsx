import { notFound } from 'next/navigation';
import { fetchShowroom } from '@/lib/payload';
import { Container, BlurInText } from '@zhic/ui';
import { ShowroomInfoCards } from '@/components/showroom/ShowroomInfoCards';
import { GlassOverlayHero } from '@/components/hero/GlassOverlayHero';
import { PayloadImage } from '@/components/PayloadImage';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const showroom = await fetchShowroom(slug);
  return {
    title: showroom?.name ?? 'شعبه',
    description: showroom?.headline ?? undefined,
  };
}

export default async function ShowroomDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  // Decode Persian/non-ASCII slugs (Next.js leaves the dynamic segment URL-encoded).
  const slug = decodeURIComponent(rawSlug);
  const showroom = await fetchShowroom(slug);
  if (!showroom) notFound();

  const city = showroom.address?.city ?? undefined;
  const cover = showroom.cover ?? showroom.gallery?.[0] ?? null;

  return (
    <>
      <GlassOverlayHero
        image={
          cover ? (
            <PayloadImage
              media={cover}
              alt={showroom.name}
              loading="eager"
              fetchPriority="high"
            />
          ) : undefined
        }
        city={city}
        title={showroom.name}
        headline={showroom.headline ?? 'فضایی آرام برای دیدن و لمس مبلمان ژیک از نزدیک.'}
      />

      <section className="pb-9">
        <ShowroomInfoCards showroom={showroom} />
      </section>

      {/* Gallery strip — simple horizontal-scrolling photo row */}
      {showroom.gallery && showroom.gallery.length > 1 ? (
        <section className="pb-9">
          <Container>
            <BlurInText as="h2" className="mb-5 text-h3 font-bold text-ink">
              گالری شعبه
            </BlurInText>
            <div className="flex gap-[var(--space-4)] overflow-x-auto pb-3">
              {showroom.gallery.map((m, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] w-[280px] shrink-0 overflow-hidden rounded-md bg-cream md:w-[360px]"
                >
                  <PayloadImage media={m} alt={`${showroom.name} — تصویر ${i + 1}`} />
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <div className="pb-12" />
    </>
  );
}
