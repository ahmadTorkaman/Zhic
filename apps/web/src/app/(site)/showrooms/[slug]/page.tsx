import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  Container,
  ImageGallery,
  PhoneLink,
  Section,
  Split,
  Stack,
} from '@zhic/ui';
import type { GalleryItem } from '@zhic/ui';
import { fetchAllShowrooms, fetchShowroom, mediaUrl } from '@/lib/payload';
import type { PayloadShowroom } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { plainTextFromRichText, RichText } from '@/lib/richtext';
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/jsonld';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { ShowroomAddressBlock } from '@/components/showrooms/ShowroomAddressBlock';
import { ShowroomCtas } from '@/components/showrooms/ShowroomCtas';
import { ShowroomFeaturedProductsRow } from '@/components/showrooms/ShowroomFeaturedProductsRow';
import { ShowroomHero } from '@/components/showrooms/ShowroomHero';
import { ShowroomHolidayHours } from '@/components/showrooms/ShowroomHolidayHours';
import { ShowroomHoursTable } from '@/components/showrooms/ShowroomHoursTable';
import { ShowroomMapEmbed } from '@/components/showrooms/ShowroomMapEmbed';

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
    openGraph: {
      type: 'website',
      title: showroom.name,
      description,
    },
  };
}

export default async function ShowroomDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [showroom, allShowrooms] = await Promise.all([
    fetchShowroom(slug),
    fetchAllShowrooms(),
  ]);
  if (!showroom) notFound();

  const items = galleryItems(showroom);
  const featured = showroom.featuredProductIds ?? [];
  const cities = [
    ...new Set(
      allShowrooms
        .map((s) => s.address?.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

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

      <Section padY="lg">
        <Container>
          <Split ratio="60/40" gap="xl">
            <Stack gap="lg">
              {showroom.description ? (
                <div className="max-w-prose">
                  <RichText value={showroom.description} />
                </div>
              ) : null}
              <ShowroomMapEmbed showroom={showroom} />
            </Stack>
            <Stack gap="lg">
              <Stack gap="md">
                <h2 className="text-h3 font-bold text-charcoal">آدرس</h2>
                <ShowroomAddressBlock showroom={showroom} />
              </Stack>
              {showroom.phone ? (
                <Stack gap="xs">
                  <h2 className="text-h3 font-bold text-charcoal">تماس</h2>
                  <PhoneLink raw={showroom.phone} className="text-h4" />
                  {showroom.email ? (
                    <a
                      href={`mailto:${showroom.email}`}
                      className="text-body text-charcoal underline underline-offset-4 hover:decoration-2"
                      dir="ltr"
                    >
                      {showroom.email}
                    </a>
                  ) : null}
                </Stack>
              ) : null}
              <Stack gap="md">
                <h2 className="text-h3 font-bold text-charcoal">ساعات کاری</h2>
                <ShowroomHoursTable hours={showroom.hours} />
                {showroom.appointmentOnly ? (
                  <p className="text-small text-stone">
                    * این شوروم فقط با وقت قبلی پذیرای مهمانان است.
                  </p>
                ) : null}
              </Stack>
              <ShowroomHolidayHours holidayHours={showroom.holidayHours} />
              {showroom.parkingNotes || showroom.transitNotes ? (
                <Stack gap="xs">
                  {showroom.parkingNotes ? (
                    <p className="text-small text-stone">
                      <strong className="text-charcoal">پارکینگ:</strong>{' '}
                      {showroom.parkingNotes}
                    </p>
                  ) : null}
                  {showroom.transitNotes ? (
                    <p className="text-small text-stone">
                      <strong className="text-charcoal">دسترسی:</strong>{' '}
                      {showroom.transitNotes}
                    </p>
                  ) : null}
                </Stack>
              ) : null}
              <ShowroomCtas showroom={showroom} />
            </Stack>
          </Split>
        </Container>
      </Section>

      {items.length > 0 ? (
        <Section padY="lg" bg="cream">
          <Container>
            <BlockReveal>
              <Stack gap="lg">
                <h2 className="text-h2 font-bold text-charcoal">گالری شوروم</h2>
                <ImageGallery items={items} layout="grid" columns={3} cellRatio="4/5" />
              </Stack>
            </BlockReveal>
          </Container>
        </Section>
      ) : null}

      <BlockReveal>
        <ShowroomFeaturedProductsRow products={featured} showroomName={showroom.name} />
      </BlockReveal>

      <Section padY="lg">
        <Container>
          <InquiryForm
            cities={cities}
            defaultCity={showroom.address?.city ?? undefined}
            defaultReason="showroom_visit"
            defaultShowroom={showroom.slug}
          />
        </Container>
      </Section>

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
