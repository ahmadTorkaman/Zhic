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
import { fetchAllShowrooms, mediaUrl } from '@/lib/payload';
import type { PayloadShowroom } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/jsonld';

const PAGE_TITLE = 'شوروم‌ها';
const PAGE_DESCRIPTION =
  'شوروم‌های ژیک در ایران — جایی که می‌توانید قطعات را از نزدیک ببینید، چوب را لمس کنید، و با تیم ما گفت‌وگو کنید.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/showrooms' },
  openGraph: {
    type: 'website',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

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

function addressLineOf(showroom: PayloadShowroom): string | undefined {
  const a = showroom.address;
  if (!a) return undefined;
  const parts = [a.district, a.street].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : undefined;
}

function hoursSummaryOf(showroom: PayloadShowroom): string | undefined {
  const open = (showroom.hours ?? []).filter(
    (h) => !h.closed && h.opens && h.closes,
  );
  const first = open[0];
  if (!first) return undefined;
  return `${first.opens} – ${first.closes}`;
}

export default async function ShowroomsIndex() {
  const showrooms = await fetchAllShowrooms();
  const ldList = itemListJsonLd(
    showrooms.map((s) => ({
      name: s.name,
      url: `/showrooms/${s.slug}`,
    })),
    SITE_URL,
    PAGE_TITLE,
  );
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: PAGE_TITLE, url: '/showrooms' },
    ],
    SITE_URL,
  );

  return (
    <>
      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[{ label: 'خانه', href: '/' }, { label: PAGE_TITLE }]}
          />
        </Container>
      </Section>
      <Section padY="lg">
        <Container>
          <Stack gap="lg">
            <Stack gap="xs">
              <h1 className="text-display font-bold text-charcoal">{PAGE_TITLE}</h1>
              <p className="text-lead text-stone max-w-prose">
                {PAGE_DESCRIPTION}
              </p>
            </Stack>
            {showrooms.length === 0 ? (
              <p className="text-body text-stone">
                در حال حاضر هیچ شورومی در دسترس نیست. لطفاً از طریق صفحه‌ی{' '}
                <a href="/contact" className="underline underline-offset-4 hover:decoration-2">
                  تماس
                </a>{' '}
                با ما در ارتباط باشید.
              </p>
            ) : (
              <Grid columns={showrooms.length >= 3 ? 3 : 2} gap="lg">
                {showrooms.map((s) => (
                  <ShowroomCard
                    key={s.id}
                    href={`/showrooms/${s.slug}`}
                    name={s.name}
                    city={s.address?.city ?? undefined}
                    addressLine={addressLineOf(s)}
                    hoursSummary={hoursSummaryOf(s)}
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
            )}
          </Stack>
        </Container>
      </Section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
