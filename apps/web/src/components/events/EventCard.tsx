import { PERSIAN_MONTHS, toPersianDigits } from '@zhic/locale';
import { RichText } from '@/lib/richtext';
import type { PayloadEventItem } from '@/lib/payload';

function toJalaliParts(iso: string | null | undefined): { day: string; month: string } | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;

    // Use Intl with Persian calendar to extract day + month index
    const dtf = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      day: 'numeric',
      month: 'numeric',
      calendar: 'persian',
    });
    const parts = dtf.formatToParts(d);
    const dayPart = parts.find((p) => p.type === 'day')?.value ?? '';
    const monthNumPart = parts.find((p) => p.type === 'month')?.value ?? '';

    // Persian digits to ASCII for numeric parsing
    const normalizedMonth = monthNumPart.replace(
      /[۰-۹]/g,
      (ch) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)),
    );
    const monthIdx = Math.max(0, Math.min(11, Number(normalizedMonth) - 1));

    // Convert day digits to Persian (they may already be Persian from Intl)
    const asciiDay = dayPart.replace(/[۰-۹]/g, (ch) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)));
    const persianDay = toPersianDigits(Number(asciiDay));

    return { day: persianDay, month: PERSIAN_MONTHS[monthIdx]! };
  } catch {
    return null;
  }
}

export type EventCardProps = {
  event: PayloadEventItem;
};

export function EventCard({ event }: EventCardProps) {
  const dateParts = toJalaliParts(event.date);

  return (
    <div className="grid grid-cols-[64px_1fr] gap-[var(--space-5)] items-start border-b border-sand py-5 last:border-b-0 sm:grid-cols-[80px_1fr]">
      {/* Date block */}
      <div className="rounded-md bg-cream p-3 text-center">
        {dateParts ? (
          <>
            <div className="text-h3 font-black leading-none text-charcoal">{dateParts.day}</div>
            <div className="text-eyebrow font-bold text-stone">{dateParts.month}</div>
          </>
        ) : (
          <div className="text-small text-stone">—</div>
        )}
      </div>

      {/* Body */}
      <div>
        <div className="mb-1 text-body font-bold text-charcoal">{event.title}</div>
        {event.description ? (
          <div className="mb-2 text-small font-light text-stone">
            <RichText value={event.description} />
          </div>
        ) : null}
        {event.location ? (
          <div className="text-eyebrow text-forest">{event.location}</div>
        ) : null}
      </div>
    </div>
  );
}
