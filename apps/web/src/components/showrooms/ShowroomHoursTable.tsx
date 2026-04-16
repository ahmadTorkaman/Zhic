import { toPersianDigits } from '@zhic/locale';
import type { ShowroomDay, ShowroomHourEntry } from '@/lib/payload';

type Props = {
  hours?: ShowroomHourEntry[] | null;
};

const DAY_LABEL: Record<ShowroomDay, string> = {
  sat: 'شنبه',
  sun: 'یکشنبه',
  mon: 'دوشنبه',
  tue: 'سه‌شنبه',
  wed: 'چهارشنبه',
  thu: 'پنجشنبه',
  fri: 'جمعه',
};

const DAY_ORDER: ShowroomDay[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

function formatRange(opens?: string | null, closes?: string | null): string {
  if (!opens || !closes) return '';
  return `${toPersianDigits(opens)} – ${toPersianDigits(closes)}`;
}

export function ShowroomHoursTable({ hours }: Props) {
  if (!hours || hours.length === 0) return null;
  const byDay = new Map<ShowroomDay, ShowroomHourEntry>();
  for (const h of hours) byDay.set(h.day, h);
  return (
    <table className="w-full border-collapse text-body">
      <caption className="sr-only">ساعات کاری</caption>
      <tbody>
        {DAY_ORDER.map((d) => {
          const entry = byDay.get(d);
          const isClosed = !entry || entry.closed;
          return (
            <tr key={d} className="border-b border-sand/60 last:border-b-0">
              <th
                scope="row"
                className="py-2 ps-0 pe-4 text-start font-bold text-charcoal"
              >
                {DAY_LABEL[d]}
              </th>
              <td className="py-2 ps-4 pe-0 text-end text-stone">
                {isClosed ? (
                  <span className="text-stone">تعطیل</span>
                ) : (
                  <span dir="ltr">{formatRange(entry?.opens, entry?.closes)}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
