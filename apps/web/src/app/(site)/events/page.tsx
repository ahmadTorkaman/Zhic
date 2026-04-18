import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section } from '@zhic/ui';
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

      <Section padY="lg" fullBleed>
        <Container>
          <div className="mx-auto max-w-[680px]">
            <h1 className="mb-3 text-h2 font-black text-ink text-balance">
              {title}
            </h1>
            <p className="mb-7 text-lead font-light text-stone">
              کارگاه‌ها، نمایشگاه‌ها، و فرصت‌های بازدید ویژه.
            </p>
            {items.length > 0 ? (
              <div>
                {items.map((event, idx) => (
                  <EventCard key={idx} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-body text-stone">
                در حال حاضر رویدادی برنامه‌ریزی نشده است.
              </p>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
