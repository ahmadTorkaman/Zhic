import { toPersianDigits } from '@zhic/locale';
import type { ShowroomHolidayEntry } from '@/lib/payload';

type Props = {
  holidayHours?: ShowroomHolidayEntry[] | null;
};

export function ShowroomHolidayHours({ holidayHours }: Props) {
  if (!holidayHours || holidayHours.length === 0) return null;
  return (
    <div className="rounded-lg border border-sand p-4">
      <h3 className="text-h4 font-bold text-charcoal mb-2">ساعات تعطیلات</h3>
      <ul className="space-y-2 text-body text-stone">
        {holidayHours.map((h, idx) => (
          <li key={idx} className="flex justify-between gap-4">
            <span className="text-charcoal">
              {h.name}
              {h.date ? ` (${toPersianDigits(h.date)})` : ''}
            </span>
            <span>
              {h.closed ? (
                'تعطیل'
              ) : h.opens && h.closes ? (
                <span dir="ltr">{toPersianDigits(h.opens)} – {toPersianDigits(h.closes)}</span>
              ) : (
                ''
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
