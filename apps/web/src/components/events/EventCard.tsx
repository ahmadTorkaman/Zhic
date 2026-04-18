import { DateDisplay } from '@zhic/ui';
import type { PayloadEventItem } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

export function EventCard({ event }: { event: PayloadEventItem }) {
  return (
    <article className="flex gap-5 rounded-lg border border-sand p-5 md:p-6">
      {event.date ? (
        <div className="flex shrink-0 flex-col items-center justify-center rounded-md bg-sand/40 px-4 py-3 text-center">
          <DateDisplay value={event.date} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-h4 font-bold text-charcoal">{event.title}</h3>
        {event.location ? (
          <p className="text-small text-stone">{event.location}</p>
        ) : null}
        {event.description ? (
          <div className="text-body text-stone">
            <RichText value={event.description} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
