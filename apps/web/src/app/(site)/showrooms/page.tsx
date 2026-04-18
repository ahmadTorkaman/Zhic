import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section } from '@zhic/ui';
import { fetchAllShowrooms } from '@/lib/payload';
import type { PayloadShowroom, ShowroomHourEntry } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/jsonld';
import { toPersianDigits } from '@zhic/locale';

const PAGE_TITLE = 'شوروم‌ها';
const PAGE_DESCRIPTION =
  'از نزدیک ببینید، لمس کنید، و با تیم ما صحبت کنید. در هر شوروم تجربه‌ای متفاوت منتظر شماست.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/showrooms' },
  openGraph: {
    type: 'website',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const DAY_FA: Record<string, string> = {
  sat: 'شنبه',
  sun: 'یکشنبه',
  mon: 'دوشنبه',
  tue: 'سه‌شنبه',
  wed: 'چهارشنبه',
  thu: 'پنج‌شنبه',
  fri: 'جمعه',
};

function addressLines(showroom: PayloadShowroom): string[] {
  const a = showroom.address;
  if (!a) return [];
  const line1 = [a.district, a.street].filter(Boolean).join('، ');
  const line2 = [a.plaque ? `پلاک ${a.plaque}` : null, a.unit ? `واحد ${a.unit}` : null]
    .filter(Boolean)
    .join('، ');
  return [line1, line2].filter((s): s is string => Boolean(s));
}

function hoursSummary(hours: ShowroomHourEntry[] | null | undefined, appointmentOnly?: boolean | null): string | null {
  if (appointmentOnly) return 'فقط با وقت قبلی';
  const open = (hours ?? []).filter((h) => !h.closed && h.opens && h.closes);
  if (open.length === 0) return null;
  const first = open[0]!;
  const last = open[open.length - 1]!;
  const dayRange =
    open.length === 1
      ? DAY_FA[first.day] ?? first.day
      : `${DAY_FA[first.day] ?? first.day} تا ${DAY_FA[last.day] ?? last.day}`;
  const time = toPersianDigits(`${first.opens} – ${first.closes}`);
  return `${dayRange} · ${time}`;
}

export default async function ShowroomsIndex() {
  const showrooms = await fetchAllShowrooms();
  const ldList = itemListJsonLd(
    showrooms.map((s) => ({
      name: s.name,
      url: `/showrooms/${s.slug}`,
    })),
    SITE_URL,
    PAGE_TITLE,
  );
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: PAGE_TITLE, url: '/showrooms' },
    ],
    SITE_URL,
  );

  return (
    <>
      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[{ label: 'خانه', href: '/' }, { label: PAGE_TITLE }]}
          />
        </Container>
      </Section>
      <Section padY="lg" fullBleed>
        <Container>
          <div className="mb-7">
            <h1 className="mb-3 text-h1 font-black text-ink">{PAGE_TITLE}</h1>
            <p className="max-w-[520px] text-lead font-light text-stone">
              {PAGE_DESCRIPTION}
            </p>
          </div>
          {showrooms.length === 0 ? (
            <p className="text-body text-stone">
              در حال حاضر هیچ شورومی در دسترس نیست. لطفاً از طریق صفحه‌ی{' '}
              <a href="/contact" className="underline underline-offset-4 hover:decoration-2">
                تماس
              </a>{' '}
              با ما در ارتباط باشید.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {showrooms.map((s) => {
                const lines = addressLines(s);
                const hrs = hoursSummary(s.hours, s.appointmentOnly);
                return (
                  <a
                    key={s.id}
                    href={`/showrooms/${s.slug}`}
                    className="glass-card block rounded-lg p-6"
                  >
                    {s.address?.city ? (
                      <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.08em] text-forest">
                        {s.address.city}
                      </div>
                    ) : null}
                    <h3 className="mb-3 text-h4 font-bold text-charcoal">{s.name}</h3>
                    {lines.length > 0 ? (
                      <div className="mb-4 text-small font-light text-stone">
                        {lines.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    ) : null}
                    {hrs ? (
                      <div className="border-t border-sand pt-3 text-eyebrow text-stone">
                        {hrs}
                      </div>
                    ) : null}
                  </a>
                );
              })}
            </div>
          )}
        </Container>
      </Section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
