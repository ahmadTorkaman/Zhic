import {
  formatDate,
  formatDateRange,
  formatNumber,
  formatPhone,
  normalizePhone,
  toPersianDigits,
  ZWNJ,
} from '@zhic/locale';
import { formatMoney, rialsToToman } from '@zhic/money';

/**
 * /lab/locale — Session 1.4 verification surface.
 *
 * Renders every formatter exported by `@zhic/locale` and `@zhic/money` so a
 * human can eyeball that:
 *   - Persian digits render correctly in Ayandeh
 *   - Jalali conversion matches the Gregorian date
 *   - ZWNJ is present in the sample Persian word
 *   - "٬" thousands separator is used in Persian display
 *   - Phone round-trips from local ASCII → spaced Persian form
 *   - Money conversion rials→toman works and displays with "تومان" suffix
 *
 * If anything looks wrong, the package exports the bug — fix it there.
 */

const SAMPLE_ISO = '2026-04-15T00:00:00Z'; // session date
const NOWRUZ_ISO = '2026-03-21T00:00:00Z';
const RANGE_END_ISO = '2026-04-25T00:00:00Z';
const SAMPLE_PHONE_LOCAL = '09123456789';
const SAMPLE_RIALS = 84_000_000n;

const rows: { label: string; value: string; note?: string }[] = [
  {
    label: 'Persian digits',
    value: toPersianDigits(1_234_567),
    note: 'toPersianDigits(1234567)',
  },
  {
    label: 'Number (thousands separator ٬)',
    value: formatNumber(1_234_567),
    note: 'formatNumber(1234567)',
  },
  {
    label: 'Jalali date — today',
    value: formatDate(SAMPLE_ISO),
    note: '2026-04-15 UTC',
  },
  {
    label: 'Jalali date — with weekday',
    value: formatDate(NOWRUZ_ISO, { withWeekday: true }),
    note: 'Nowruz 1405',
  },
  {
    label: 'Jalali date range',
    value: formatDateRange(SAMPLE_ISO, RANGE_END_ISO),
    note: '15 Apr – 25 Apr 2026',
  },
  {
    label: 'Phone — normalized',
    value: normalizePhone(SAMPLE_PHONE_LOCAL),
    note: `normalizePhone('${SAMPLE_PHONE_LOCAL}')`,
  },
  {
    label: 'Phone — display',
    value: formatPhone(normalizePhone(SAMPLE_PHONE_LOCAL)),
    note: '+989123456789 → spaced Persian',
  },
  {
    label: 'Money — default (toman)',
    value: formatMoney(SAMPLE_RIALS),
    note: `formatMoney(${SAMPLE_RIALS}n)`,
  },
  {
    label: 'Money — unit:rial',
    value: formatMoney(SAMPLE_RIALS, { unit: 'rial' }),
    note: 'storage unit for debugging',
  },
  {
    label: 'Money — ASCII digits',
    value: formatMoney(SAMPLE_RIALS, { digits: 'en' }),
    note: 'for invoices and CSV export',
  },
  {
    label: 'Conversion — rials → toman',
    value: `${SAMPLE_RIALS} → ${rialsToToman(SAMPLE_RIALS)}`,
    note: 'bigint math, no float',
  },
  {
    label: 'ZWNJ — می‌خواهید',
    value: `می${ZWNJ}خواهید`,
    note: 'U+200C between می and خواهید',
  },
];

export default function LocaleLabPage() {
  return (
    <div dir="rtl" className="space-y-16">
      <header className="space-y-2">
        <p className="text-eyebrow font-bold uppercase tracking-[0.2em] text-stone">
          Session 1.4 · Verification
        </p>
        <h1 className="text-h1 font-black text-charcoal">
          Locale &amp; Money — اعداد، تاریخ، تلفن، قیمت
        </h1>
        <p className="text-body text-stone">
          هر مقدار در این جدول از <code dir="ltr">@zhic/locale</code> یا{' '}
          <code dir="ltr">@zhic/money</code> خوانده می‌شود. اگر چیزی اشتباه به
          نظر می‌رسد، خود بسته اشتباه است — نه این صفحه.
        </p>
      </header>

      <section className="border border-sand">
        <table className="w-full text-body">
          <thead className="bg-cream text-[11px] uppercase tracking-[0.2em] text-stone">
            <tr>
              <th className="px-6 py-3 text-start" dir="ltr">
                Formatter
              </th>
              <th className="px-6 py-3 text-start">خروجی</th>
              <th className="px-6 py-3 text-start" dir="ltr">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-sand/60">
                <td
                  className="px-6 py-4 align-top font-mono text-[12px]"
                  dir="ltr"
                >
                  {r.label}
                </td>
                <td className="px-6 py-4 align-top text-h4">{r.value}</td>
                <td
                  className="px-6 py-4 align-top text-[11px] text-stone"
                  dir="ltr"
                >
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
