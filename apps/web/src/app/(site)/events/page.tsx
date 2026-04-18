import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import { fetchEvents } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { EventCard } from '@/components/events/EventCard';

const FALLBACK_TITLE = 'رویدادها';

export async function generateMetadata(): Promise<Metadata> {
  const events = await fetchEvents();
  const title = events?.title ?? FALLBACK_TITLE;
  return {
    title,
    description: 'کارگاه‌ها، نمایشگاه‌ها و رویدادهای ژیک.',
    alternates: { canonical: '/events' },
    openGraph: {
      type: 'website',
      title,
      description: 'کارگاه‌ها، نمایشگاه‌ها و رویدادهای ژیک.',
    },
  };
}

export default async function EventsPage() {
  const events = await fetchEvents();
  const title = events?.title ?? FALLBACK_TITLE;
  const items = events?.items ?? [];

  const ldCrumbs = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/events' },
    ],
    SITE_URL,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCrumbs) }}
      />

      <Section padY="md">
        <Container>
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: title }]} />
        </Container>
      </Section>

      <Section padY="lg">
        <Container>
          <Stack gap="lg">
            <h1 className="text-display font-bold text-charcoal text-balance">
              {title}
            </h1>
            {items.length > 0 ? (
              <div className="flex max-w-prose flex-col gap-4">
                {items.map((event, idx) => (
                  <EventCard key={idx} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-body text-stone">
                در حال حاضر رویدادی برنامه‌ریزی نشده است.
              </p>
            )}
          </Stack>
        </Container>
      </Section>
    </>
  );
}
