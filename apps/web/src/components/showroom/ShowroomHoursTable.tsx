import { toPersianDigits } from '@zhic/locale';
import type { ShowroomDay, ShowroomHourEntry } from '@/lib/payload';

export type ShowroomHoursTableProps = {
  hours: ShowroomHourEntry[];
  appointmentOnly?: boolean;
};

const DAY_LABELS: Record<ShowroomDay, string> = {
  sat: 'شنبه',
  sun: 'یکشنبه',
  mon: 'دوشنبه',
  tue: 'سه‌شنبه',
  wed: 'چهارشنبه',
  thu: 'پنجشنبه',
  fri: 'جمعه',
};

const WEEK_ORDER: ShowroomDay[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

export function ShowroomHoursTable({ hours, appointmentOnly }: ShowroomHoursTableProps) {
  if (appointmentOnly) {
    return (
      <p className="text-small text-stone">
        بازدید این شوروم فقط با وقت قبلی امکان‌پذیر است.
      </p>
    );
  }

  if (hours.length === 0) {
    return (
      <p className="text-small text-stone">برای ساعات کاری با ما تماس بگیرید.</p>
    );
  }

  // Index hours by day so we can iterate in week order
  const byDay = new Map<ShowroomDay, ShowroomHourEntry>();
  for (const h of hours) byDay.set(h.day, h);

  return (
    <table className="w-full border-collapse text-small">
      <tbody>
        {WEEK_ORDER.map((day) => {
          const entry = byDay.get(day);
          const hoursCell =
            entry?.closed
              ? 'تعطیل'
              : entry?.opens && entry.closes
                ? `${toPersianDigits(entry.opens)} – ${toPersianDigits(entry.closes)}`
                : '—';
          return (
            <tr key={day} className="border-b border-sand last:border-b-0">
              <th scope="row" className="py-2 text-start font-normal text-stone">
                {DAY_LABELS[day]}
              </th>
              <td
                className="py-2 text-end text-charcoal"
                dir={entry?.closed ? undefined : 'ltr'}
              >
                {hoursCell}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
