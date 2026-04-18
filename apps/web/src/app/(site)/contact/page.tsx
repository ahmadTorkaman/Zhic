import type { Metadata } from 'next';
import {
  Breadcrumbs,
  Container,
  Grid,
  PhoneLink,
  Section,
  ShowroomCard,
  Stack,
} from '@zhic/ui';
import { fetchAllShowrooms, fetchContact, mediaUrl } from '@/lib/payload';
import type { PayloadShowroom } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, contactPageJsonLd } from '@/lib/jsonld';
import { CentralPhoneCallout } from '@/components/contact/CentralPhoneCallout';
import { InquiryForm } from '@/components/inquiry/InquiryForm';

const PAGE_TITLE = 'تماس با ژیک';
const PAGE_DESCRIPTION =
  'برای مشاوره، استعلام قیمت یا رزرو بازدید از شوروم‌ها — تیم ژیک در ساعات کاری پاسخ‌گوی شماست.';

function ShowroomCover({ showroom }: { showroom: PayloadShowroom }) {
  const src = mediaUrl(showroom.cover ?? showroom.gallery?.[0] ?? null);
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        {showroom.address?.city ?? 'شوروم'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={showroom.cover?.alt ?? showroom.gallery?.[0]?.alt ?? showroom.name}
      className="h-full w-full object-cover"
    />
  );
}

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [contact, showrooms, sp] = await Promise.all([
    fetchContact(),
    fetchAllShowrooms(),
    searchParams,
  ]);

  const cities = [
    ...new Set(
      showrooms
        .map((s) => s.address?.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  const qProduct = typeof sp.product === 'string' ? sp.product : undefined;
  const qReason = sp.reason === 'quote' ? 'price_inquiry' as const
    : sp.reason === 'visit' ? 'showroom_visit' as const
    : undefined;
  const qShowroom = typeof sp.showroom === 'string' ? sp.showroom : undefined;
  const qCity = qShowroom
    ? showrooms.find((s) => s.slug === qShowroom)?.address?.city ?? undefined
    : undefined;
  const central = showrooms.find((s) => s.is_central) ?? showrooms[0] ?? null;
  const others = showrooms.filter((s) => s !== central);

  const ldContact = contactPageJsonLd({
    name: PAGE_TITLE,
    url: `${SITE_URL}/contact`,
    description: PAGE_DESCRIPTION,
  });
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: 'تماس', url: '/contact' },
    ],
    SITE_URL,
  );

  // Contact global may carry a fallback phone if no central showroom is set.
  const fallbackPhone = !central && contact?.phone ? contact.phone : null;

  return (
    <>
      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[{ label: 'خانه', href: '/' }, { label: 'تماس' }]}
          />
        </Container>
      </Section>

      <Section padY="lg">
        <Container>
          <Stack gap="md" align="center">
            <h1 className="text-display font-bold text-charcoal text-center text-balance">
              {contact?.title ?? PAGE_TITLE}
            </h1>
            <p className="text-lead text-stone max-w-prose text-center">
              {PAGE_DESCRIPTION}
            </p>
          </Stack>
        </Container>
      </Section>

      <CentralPhoneCallout showroom={central} />

      {fallbackPhone ? (
        <Section bg="cream" padY="lg">
          <Container>
            <Stack gap="md" align="center">
              <p className="text-small uppercase tracking-wide text-stone">
                مرکز تماس ژیک
              </p>
              <p className="text-h2 font-bold text-charcoal">
                <PhoneLink raw={fallbackPhone} className="!text-h2 !no-underline" />
              </p>
              {contact?.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-body text-charcoal underline underline-offset-4 hover:decoration-2"
                  dir="ltr"
                >
                  {contact.email}
                </a>
              ) : null}
            </Stack>
          </Container>
        </Section>
      ) : null}

      {others.length > 0 ? (
        <Section padY="lg">
          <Container>
            <Stack gap="lg">
              <h2 className="text-h2 font-bold text-charcoal">شوروم‌های دیگر</h2>
              <Grid columns={others.length >= 3 ? 3 : 2} gap="lg">
                {others.map((s) => (
                  <ShowroomCard
                    key={s.id}
                    href={`/showrooms/${s.slug}`}
                    name={s.name}
                    city={s.address?.city ?? undefined}
                    phone={
                      s.phone
                        ? {
                            label: <PhoneLink raw={s.phone} inline />,
                            e164: s.phone,
                          }
                        : undefined
                    }
                    cover={<ShowroomCover showroom={s} />}
                  />
                ))}
              </Grid>
            </Stack>
          </Container>
        </Section>
      ) : null}

      <Section padY="lg" bg={others.length > 0 ? 'cream' : 'transparent'}>
        <Container>
          <InquiryForm
            cities={cities}
            defaultCity={qCity}
            defaultReason={qReason}
            defaultProduct={qProduct}
            defaultShowroom={qShowroom}
          />
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldContact) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
