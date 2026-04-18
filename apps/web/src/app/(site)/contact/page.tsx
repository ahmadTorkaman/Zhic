import type { Metadata } from 'next';
import { Container, Section } from '@zhic/ui';
import { fetchAllShowrooms, fetchContact } from '@/lib/payload';
import type { PayloadShowroom } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, contactPageJsonLd } from '@/lib/jsonld';
import { ContactInquiryForm } from '@/components/contact/ContactInquiryForm';
import { toPersianDigits } from '@zhic/locale';

const PAGE_TITLE = 'تماس با ژیک';
const PAGE_DESCRIPTION =
  'برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید. تیم ما آماده‌ی پاسخ‌گویی است.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: { type: 'website', title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

function addressLine(s: PayloadShowroom): string | null {
  const a = s.address;
  if (!a) return null;
  return [a.district, a.street].filter(Boolean).join('، ') || null;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [contact, showrooms, sp] = await Promise.all([
    fetchContact(),
    fetchAllShowrooms(),
    searchParams,
  ]);

  const cities = [
    ...new Set(
      showrooms
        .map((s) => s.address?.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  const qProduct = typeof sp.product === 'string' ? sp.product : undefined;
  const qReason =
    sp.reason === 'quote'
      ? ('price_inquiry' as const)
      : sp.reason === 'visit'
        ? ('showroom_visit' as const)
        : undefined;
  const qShowroom = typeof sp.showroom === 'string' ? sp.showroom : undefined;
  const qCity = qShowroom
    ? (showrooms.find((s) => s.slug === qShowroom)?.address?.city ?? undefined)
    : undefined;
  const central = showrooms.find((s) => s.is_central) ?? showrooms[0] ?? null;
  const fallbackPhone = central?.phone ?? contact?.phone ?? null;
  const fallbackEmail = contact?.email ?? null;

  const ldContact = contactPageJsonLd({
    name: PAGE_TITLE,
    url: `${SITE_URL}/contact`,
    description: PAGE_DESCRIPTION,
  });
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: 'تماس', url: '/contact' },
    ],
    SITE_URL,
  );

  return (
    <>
      {/* Dark hero: text-col RTL-start (right), form-col RTL-end (left) */}
      <Section bg="ink" padY="xl" fullBleed className="relative overflow-hidden">
        {/* Decorative radial forest glow at top-end (RTL) corner */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-[200px] -end-[200px] h-[600px] w-[600px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-forest) 6%, transparent) 0%, transparent 70%)',
          }}
        />
        <Container>
          <div className="relative grid grid-cols-1 items-start gap-9 md:grid-cols-2 md:gap-10">
            {/* Text col */}
            <div>
              <span aria-hidden className="mb-6 block h-[2px] w-12 bg-gold" />
              <h1 className="mb-4 text-h2 font-black leading-[var(--leading-h2)] text-ivory">
                با ما در تماس باشید
              </h1>
              <p className="mb-6 text-body font-light leading-[1.85] text-sand">
                {PAGE_DESCRIPTION}
              </p>
              {fallbackPhone ? (
                <div className="mb-5">
                  <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-gold">
                    دفتر مرکزی
                  </h3>
                  <div className="text-h3 font-bold text-ivory" dir="ltr">
                    {fallbackPhone}
                  </div>
                  {fallbackEmail ? (
                    <a
                      href={`mailto:${fallbackEmail}`}
                      className="mt-1 block text-small font-light text-sand underline-offset-4 hover:underline"
                      dir="ltr"
                    >
                      {fallbackEmail}
                    </a>
                  ) : null}
                </div>
              ) : null}
              <div>
                <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-gold">
                  ساعات پاسخ‌گویی
                </h3>
                <div className="text-small font-light text-sand">
                  شنبه تا پنجشنبه · {toPersianDigits('09:00')} – {toPersianDigits('17:00')}
                </div>
              </div>
            </div>

            {/* Form col */}
            <ContactInquiryForm
              cities={cities}
              defaultCity={qCity}
              defaultReason={qReason}
              defaultProduct={qProduct}
              defaultShowroom={qShowroom}
            />
          </div>
        </Container>
      </Section>

      {/* Showrooms grid on ivory */}
      {showrooms.length > 0 ? (
        <Section padY="xl" fullBleed>
          <Container>
            <h2 className="mb-6 text-h3 font-bold text-ink">شوروم‌ها</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {showrooms.map((s) => {
                const line = addressLine(s);
                return (
                  <a
                    key={s.id}
                    href={`/showrooms/${s.slug}`}
                    className="glass-card block rounded-md p-5 md:p-7"
                  >
                    {s.address?.city ? (
                      <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.08em] text-forest">
                        {s.address.city}
                      </div>
                    ) : null}
                    <h3 className="mb-3 text-h4 font-bold text-charcoal">{s.name}</h3>
                    {line ? (
                      <div className="text-small font-light text-stone">{line}</div>
                    ) : null}
                  </a>
                );
              })}
            </div>
          </Container>
        </Section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldContact) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
