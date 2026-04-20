import { Container, Breadcrumbs } from '@zhic/ui';
import { EventCard } from '@/components/events/EventCard';
import { fetchEvents, type PayloadEventItem } from '@/lib/payload';

const FALLBACK_ITEMS: PayloadEventItem[] = [
  {
    title: 'کارگاه آشنایی با چوب گردو',
    description: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'یک روز کامل در کارگاه همدان با تیم فنی ژیک. از انتخاب چوب تا ساخت یک قطعه‌ی کوچک.',
              },
            ],
          },
        ],
      },
    },
    date: '2026-05-15',
    location: 'شوروم همدان',
  },
  {
    title: 'نمایشگاه مبلمان تهران',
    description: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'حضور ژیک در بیست‌وپنجمین نمایشگاه بین‌المللی مبلمان و دکوراسیون تهران. غرفه‌ی شماره‌ی ۴۲.',
              },
            ],
          },
        ],
      },
    },
    date: '2026-05-31',
    location: 'نمایشگاه بین‌المللی تهران',
  },
  {
    title: 'روز درهای باز — شوروم ونک',
    description: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'بازدید آزاد از شوروم ونک با مشاوره‌ی رایگان طراحی داخلی و پذیرایی ویژه.',
              },
            ],
          },
        ],
      },
    },
    date: '2026-06-22',
    location: 'شوروم تهران',
  },
];

export function generateMetadata() {
  return {
    title: 'رویدادها',
    description: 'کارگاه‌ها، نمایشگاه‌ها، و فرصت‌های بازدید ویژه‌ی ژیک.',
  };
}

export default async function EventsPage() {
  const events = await fetchEvents();
  const items = events?.items && events.items.length > 0 ? events.items : FALLBACK_ITEMS;

  return (
    <Container>
      <div className="pt-6">
        <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'رویدادها' }]} />
      </div>
      <div className="mx-auto max-w-[680px] pb-[var(--space-9)] pt-[var(--space-7)]">
        <h1 className="mb-3 text-h2 font-black text-ink">
          {events?.title ?? 'رویدادها'}
        </h1>
        <p className="mb-[var(--space-7)] text-lead font-light text-stone">
          کارگاه‌ها، نمایشگاه‌ها، و فرصت‌های بازدید ویژه.
        </p>

        {items.length === 0 ? (
          <p className="text-stone">رویدادی برای نمایش وجود ندارد.</p>
        ) : (
          <div>
            {items.map((item, i) => (
              <EventCard key={i} event={item} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
