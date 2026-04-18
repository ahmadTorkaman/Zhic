import type { PayloadEventItem } from '@/lib/payload';
import { RichText } from '@/lib/richtext';
import { formatDate, toPersianDigits } from '@zhic/locale';

/**
 * Parse a Jalali "DAY MONTH YEAR" string into separate day + month parts.
 * formatDate returns e.g. "۸ فروردین ۱۴۰۵" — we split on the first two spaces.
 */
function jalaliDayMonth(iso: string): { day: string; month: string } | null {
  try {
    const formatted = formatDate(iso);
    const [day, month] = formatted.split(' ');
    if (!day || !month) return null;
    return { day, month };
  } catch {
    return null;
  }
}

export function EventCard({ event }: { event: PayloadEventItem }) {
  const date = event.date ? jalaliDayMonth(event.date) : null;
  return (
    <article className="grid grid-cols-[80px_1fr] items-start gap-5 border-b border-sand py-5 last:border-b-0">
      {date ? (
        <div className="flex flex-col items-center justify-center rounded-md bg-cream px-3 py-3 text-center">
          <div className="text-h3 font-black leading-none text-charcoal">
            {toPersianDigits(date.day)}
          </div>
          <div className="mt-1 text-eyebrow font-bold text-stone">
            {date.month}
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-1 text-body font-bold text-charcoal">
          {event.title}
        </h3>
        {event.description ? (
          <div className="mb-2 text-small font-light text-stone">
            <RichText value={event.description} />
          </div>
        ) : null}
        {event.location ? (
          <p className="text-eyebrow font-bold uppercase tracking-[0.06em] text-forest">
            {event.location}
          </p>
        ) : null}
      </div>
    </article>
  );
}
