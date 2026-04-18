# D4: Showroom Detail + Contact Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development.

**Goal:** Rewrite Showroom Detail to A5-B "Glass Card Overlay" and Contact to A6-B "Dark Hero + Frosted Form".

**Architecture:** Three tasks. Showroom detail loses the 60/40 sidebar layout entirely — replaced with a centered glass-card hero overlay and three image-less info-glass-cards in a row (address+map, hours table, phone+CTAs), gallery strip below. Contact gets a dark `bg-ink` hero matching D1's HomeInquiryCta pattern, with text-col (gold-line + h1 + lead + gold-eyebrow phone/email blocks) on RTL-start and a frosted glass form card on RTL-end carrying the full 5-field InquiryForm in dark variant. Showrooms grid below on ivory using the same `glass-card` utility from D1's HomeShowroomsStrip pattern.

**Branch:** `claude/plan-session-2-1-bUd75` (continuing from D3, latest `9bbcd46`).

**D1+D2+D3 lessons applied:**
- `fullBleed` on Section when explicit Container is needed
- `hover:translate-y-[var(--hover-lift-card)]` for card hovers
- `color-mix(in srgb, var(--color-X) N%, transparent)` for token-tracking glows
- `aria-current` on active filter pills
- Don't override line-heights that text-* tokens already include
- `aria-busy`/`aria-invalid`/`aria-describedby` on dark forms

**Mockup references (Option B):**
- `.superpowers/a5-showroom.html` — lines 92–117 (B styles), 197–242 (B markup)
- `.superpowers/a6-contact.html` — lines 109–130 (B styles), 231–285 (B markup)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/components/showrooms/ShowroomHero.tsx` | Modify | Photo hero with charcoal scrim + centered frosted glass card carrying city eyebrow + h1 + headline + single forest "رزرو بازدید" CTA |
| `apps/web/src/components/showrooms/ShowroomInfoCards.tsx` | Create | The 3-glass-card row: address+inline-map / hours table / phone+CTAs. Each is a `.glass-card`. Mobile stacks vertically. |
| `apps/web/src/app/(site)/showrooms/[slug]/page.tsx` | Modify | Drop the Split sidebar layout. New composition: sticky breadcrumb → hero → ShowroomInfoCards → gallery strip → featured products row. Drop the standalone InquiryForm at the bottom (it's redundant — the contact page has it; showroom detail just routes to /contact via the rezerv-bazdid CTA). |
| `apps/web/src/components/contact/ContactInquiryForm.tsx` | Create | Client wrapper around `submitInquiry` styled for dark glass (mirrors D1's HomeInquiryForm but renders the FULL 5-field form: name, phone, city select, reason select, message). Hidden defaults can be passed via props. |
| `apps/web/src/app/(site)/contact/page.tsx` | Modify | Compose: dark hero with text-col (gold-line + h1 + lead + phone/hours blocks) RTL-start + form-card RTL-end → showrooms section on ivory using glass cards. |
| `docs/state.md` | Modify (final) | Mark D4 complete |

---

## Task 1: Showroom Detail — glass card overlay

**Files:** Modify `ShowroomHero.tsx`, create `ShowroomInfoCards.tsx`, modify `[slug]/page.tsx`.

### Step 1: Rewrite ShowroomHero.tsx

```tsx
import type { PayloadShowroom } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';

type Props = {
  showroom: PayloadShowroom;
};

export function ShowroomHero({ showroom }: Props) {
  const cover = mediaUrl(showroom.cover ?? showroom.gallery?.[0] ?? null);
  const visit = `/contact?showroom=${encodeURIComponent(showroom.slug)}&reason=visit`;
  return (
    <section className="relative mb-9 flex min-h-[55vh] items-center justify-center overflow-hidden bg-cream">
      {cover ? (
        <img
          src={cover}
          alt={showroom.cover?.alt ?? showroom.gallery?.[0]?.alt ?? showroom.name}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {/* Dark scrim */}
      <span aria-hidden className="absolute inset-0 bg-ink/30 pointer-events-none" />

      {/* Centered glass overlay card */}
      <div className="glass-card relative z-10 mx-4 max-w-[520px] rounded-lg p-8 text-center shadow-card">
        {showroom.address?.city ? (
          <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.12em] text-forest">
            {showroom.address.city}
          </div>
        ) : null}
        <h1 className="mb-3 text-h2 font-black text-ink text-balance">
          {showroom.name}
        </h1>
        {showroom.headline ? (
          <p className="mb-5 text-body font-light text-stone">
            {showroom.headline}
          </p>
        ) : null}
        <a
          href={visit}
          className="inline-flex items-center justify-center rounded-md bg-forest px-9 py-4 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:shadow-elevated"
        >
          رزرو بازدید
        </a>
      </div>
    </section>
  );
}
```

Drops the `Section`/`Container`/`Stack` imports (now uses native `<section>` for the full-bleed photo hero). Drops the `text-display` h1 + sticky-color-flip logic — the glass overlay always uses `text-ink` headline regardless of cover presence. Adds `loading="eager" fetchPriority="high"` to the cover img (LCP).

### Step 2: Create ShowroomInfoCards.tsx

```tsx
import type { PayloadShowroom } from '@/lib/payload';
import { classifyPhone } from '@zhic/locale';
import { ShowroomHoursTable } from './ShowroomHoursTable';
import { ShowroomMapEmbed } from './ShowroomMapEmbed';
import { ShowroomAddressBlock } from './ShowroomAddressBlock';

type Props = {
  showroom: PayloadShowroom;
};

function mapHref(showroom: PayloadShowroom): string | null {
  if (showroom.neshanProfileUrl) return showroom.neshanProfileUrl;
  if (showroom.googleBusinessProfileUrl) return showroom.googleBusinessProfileUrl;
  if (
    showroom.geo &&
    typeof showroom.geo.lat === 'number' &&
    typeof showroom.geo.lng === 'number'
  ) {
    return `https://neshan.org/maps#c${showroom.geo.lat}-${showroom.geo.lng}-15z-0p`;
  }
  return null;
}

export function ShowroomInfoCards({ showroom }: Props) {
  const phone = showroom.phone ? classifyPhone(showroom.phone) : null;
  const map = mapHref(showroom);
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {/* Address + inline map */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-stone">
          آدرس
        </h3>
        <ShowroomAddressBlock showroom={showroom} />
        <div className="mt-4">
          <ShowroomMapEmbed showroom={showroom} />
        </div>
      </div>

      {/* Hours table */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-stone">
          ساعات کاری
        </h3>
        <ShowroomHoursTable hours={showroom.hours} />
        {showroom.appointmentOnly ? (
          <p className="mt-3 text-small text-stone">
            * این شوروم فقط با وقت قبلی پذیرای مهمانان است.
          </p>
        ) : null}
      </div>

      {/* Phone + CTAs */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-stone">
          تماس
        </h3>
        {phone ? (
          <div className="text-h4 font-bold text-charcoal" dir="ltr">
            {showroom.phone}
          </div>
        ) : null}
        {showroom.email ? (
          <a
            href={`mailto:${showroom.email}`}
            className="mt-1 block text-small text-stone underline-offset-4 hover:underline"
            dir="ltr"
          >
            {showroom.email}
          </a>
        ) : null}
        <div className="mt-5 flex flex-col gap-3">
          {phone ? (
            <a
              href={`tel:${phone.e164}`}
              className="inline-flex items-center justify-center rounded-md bg-charcoal px-9 py-3 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:bg-ink hover:shadow-subtle"
            >
              تماس با شوروم
            </a>
          ) : null}
          {map ? (
            <a
              href={map}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-sand bg-transparent px-9 py-3 text-small font-bold text-charcoal transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:border-charcoal"
            >
              مسیریابی
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Rewrite [slug]/page.tsx

New composition:
- Sticky breadcrumb (preserved)
- ShowroomHero (full-bleed photo + glass overlay)
- Container with: optional description (centered prose) + ShowroomInfoCards + gallery + featured products
- Drop the bottom InquiryForm — visitors who want to submit are routed to /contact via the hero CTA

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  Container,
  ImageGallery,
  Section,
  Stack,
} from '@zhic/ui';
import type { GalleryItem } from '@zhic/ui';
import { fetchShowroom, mediaUrl } from '@/lib/payload';
import type { PayloadShowroom } from '@/lib/payload';
import { SITE_URL } from '@/lib/env';
import { plainTextFromRichText, RichText } from '@/lib/richtext';
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/jsonld';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { ShowroomFeaturedProductsRow } from '@/components/showrooms/ShowroomFeaturedProductsRow';
import { ShowroomHero } from '@/components/showrooms/ShowroomHero';
import { ShowroomInfoCards } from '@/components/showrooms/ShowroomInfoCards';

function galleryItems(showroom: PayloadShowroom): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (const m of showroom.gallery ?? []) {
    const src = mediaUrl(m);
    if (!src) continue;
    items.push({ src, alt: m.alt ?? '', kind: 'image' });
  }
  return items;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const showroom = await fetchShowroom(slug);
  if (!showroom) return { title: 'شوروم یافت نشد' };
  const description =
    showroom.headline ??
    plainTextFromRichText(showroom.description) ??
    `شوروم ژیک در ${showroom.address?.city ?? 'ایران'}.`;
  return {
    title: showroom.name,
    description,
    alternates: { canonical: `/showrooms/${slug}` },
    openGraph: { type: 'website', title: showroom.name, description },
  };
}

export default async function ShowroomDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const showroom = await fetchShowroom(slug);
  if (!showroom) notFound();

  const items = galleryItems(showroom);
  const featured = showroom.featuredProductIds ?? [];

  const ldLocal = localBusinessJsonLd(showroom, SITE_URL);
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: 'شوروم‌ها', url: '/showrooms' },
      { name: showroom.name, url: `/showrooms/${showroom.slug}` },
    ],
    SITE_URL,
  );

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-sand/40 bg-ivory/90 backdrop-blur">
        <Container>
          <div className="py-3">
            <Breadcrumbs
              items={[
                { label: 'خانه', href: '/' },
                { label: 'شوروم‌ها', href: '/showrooms' },
                { label: showroom.name },
              ]}
            />
          </div>
        </Container>
      </div>

      <ShowroomHero showroom={showroom} />

      <Section padY="lg" fullBleed>
        <Container>
          <Stack gap="lg">
            {showroom.description ? (
              <div className="mx-auto max-w-[680px] text-body leading-[1.85] text-charcoal">
                <RichText value={showroom.description} />
              </div>
            ) : null}
            <ShowroomInfoCards showroom={showroom} />
          </Stack>
        </Container>
      </Section>

      {items.length > 0 ? (
        <Section padY="lg" bg="cream">
          <Container>
            <BlockReveal>
              <Stack gap="lg">
                <h2 className="text-h3 font-bold text-charcoal">گالری شوروم</h2>
                <ImageGallery items={items} layout="grid" columns={3} cellRatio="4/5" />
              </Stack>
            </BlockReveal>
          </Container>
        </Section>
      ) : null}

      <BlockReveal>
        <ShowroomFeaturedProductsRow products={featured} showroomName={showroom.name} />
      </BlockReveal>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldLocal) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
    </>
  );
}
```

Drops imports of: Split, PhoneLink, fetchAllShowrooms, BlockReveal of inquiry section, InquiryForm, ShowroomAddressBlock, ShowroomCtas, ShowroomHolidayHours, ShowroomHoursTable, ShowroomMapEmbed (those are now consumed inside ShowroomInfoCards). Drops the bottom InquiryForm section entirely. Holiday hours / parking / transit notes are no longer rendered inline (they could be added back to ShowroomInfoCards if needed — for D4 we focus on the mockup's three-card composition).

### Step 4: Type-check + commit

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/showrooms/ShowroomHero.tsx \
        apps/web/src/components/showrooms/ShowroomInfoCards.tsx \
        apps/web/src/app/\(site\)/showrooms/\[slug\]/page.tsx
git commit -m "feat(showrooms): glass-card overlay layout on detail page ..."
```

---

## Task 2: Contact — dark hero + frosted form

**Files:** Create `ContactInquiryForm.tsx`, modify `contact/page.tsx`.

### Step 1: Create ContactInquiryForm.tsx

A client component wrapping `submitInquiry`. Renders the FULL form (5 fields: name, phone, city dropdown, reason dropdown, optional preferred_date when reason="showroom_visit", message). Same dark-glass styling as HomeInquiryForm but with the full field set.

```tsx
'use client';

import { useActionState, useState } from 'react';
import { submitInquiry, type InquiryState } from '@/app/actions/submitInquiry';

const INITIAL: InquiryState = { success: false };

type Props = {
  cities: string[];
  defaultCity?: string;
  defaultReason?: 'price_inquiry' | 'showroom_visit';
  defaultProduct?: string;
  defaultShowroom?: string;
};

export function ContactInquiryForm({
  cities,
  defaultCity,
  defaultReason,
  defaultProduct,
  defaultShowroom,
}: Props) {
  const [state, action, isPending] = useActionState(submitInquiry, INITIAL);
  const [reason, setReason] = useState(defaultReason ?? '');

  const inputClass =
    'w-full rounded-md border border-ivory/10 bg-transparent px-4 py-[14px] text-body text-ivory placeholder:text-ivory/20 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)]';
  const labelClass = 'mb-2 block text-small font-light text-sand';

  return (
    <form
      action={action}
      aria-busy={isPending}
      className="rounded-lg border border-ivory/[0.06] bg-ivory/[0.03] p-7"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <h2 className="mb-5 text-h4 font-bold text-ivory">ارسال پیام</h2>

      {defaultProduct ? <input type="hidden" name="product" value={defaultProduct} /> : null}
      {defaultShowroom ? <input type="hidden" name="showroom" value={defaultShowroom} /> : null}

      {state.errors?.general ? (
        <p
          role="alert"
          className="mb-5 rounded-md border border-rust/40 bg-rust/10 p-3 text-small text-ivory"
        >
          {state.errors.general}
        </p>
      ) : null}

      <label className={labelClass} htmlFor="contact-name">نام و نام خانوادگی</label>
      <input
        id="contact-name"
        name="name"
        required
        placeholder="مثال: احمد نیوتن"
        aria-invalid={Boolean(state.errors?.name)}
        aria-describedby={state.errors?.name ? 'contact-name-error' : undefined}
        className={`${inputClass} mb-1`}
      />
      {state.errors?.name ? (
        <p id="contact-name-error" className="mb-3 text-small text-rust">{state.errors.name}</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className={labelClass} htmlFor="contact-phone">شماره‌ی تماس</label>
      <input
        id="contact-phone"
        name="phone"
        type="tel"
        dir="ltr"
        required
        placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
        aria-invalid={Boolean(state.errors?.phone)}
        aria-describedby={state.errors?.phone ? 'contact-phone-error' : undefined}
        className={`${inputClass} mb-1`}
      />
      {state.errors?.phone ? (
        <p id="contact-phone-error" className="mb-3 text-small text-rust">{state.errors.phone}</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className={labelClass} htmlFor="contact-city">شهر</label>
      <select
        id="contact-city"
        name="city"
        required
        defaultValue={defaultCity ?? ''}
        aria-invalid={Boolean(state.errors?.city)}
        aria-describedby={state.errors?.city ? 'contact-city-error' : undefined}
        className={`${inputClass} mb-1`}
      >
        <option value="" disabled>انتخاب کنید</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value="سایر شهرها">سایر شهرها</option>
      </select>
      {state.errors?.city ? (
        <p id="contact-city-error" className="mb-3 text-small text-rust">{state.errors.city}</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className={labelClass} htmlFor="contact-reason">موضوع</label>
      <select
        id="contact-reason"
        name="reason"
        required
        defaultValue={defaultReason ?? ''}
        onChange={(e) => setReason(e.target.value)}
        aria-invalid={Boolean(state.errors?.reason)}
        aria-describedby={state.errors?.reason ? 'contact-reason-error' : undefined}
        className={`${inputClass} mb-1`}
      >
        <option value="" disabled>انتخاب کنید</option>
        <option value="price_inquiry">استعلام قیمت</option>
        <option value="showroom_visit">رزرو بازدید از شوروم</option>
      </select>
      {state.errors?.reason ? (
        <p id="contact-reason-error" className="mb-3 text-small text-rust">{state.errors.reason}</p>
      ) : (
        <div className="mb-3" />
      )}

      {reason === 'showroom_visit' ? (
        <>
          <label className={labelClass} htmlFor="contact-date">تاریخ ترجیحی بازدید</label>
          <input
            id="contact-date"
            name="preferred_date"
            placeholder="مثال: هفته‌ی اول خرداد"
            className={`${inputClass} mb-3`}
          />
        </>
      ) : null}

      <label className={labelClass} htmlFor="contact-message">پیام</label>
      <textarea
        id="contact-message"
        name="message"
        rows={4}
        placeholder="درباره‌ی چه محصولی سؤال دارید؟"
        className={`${inputClass} mb-5 resize-none`}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-forest px-4 py-4 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-forest)_25%,transparent)] focus-ring-invert disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'در حال ارسال…' : 'ارسال پیام'}
      </button>
    </form>
  );
}
```

### Step 2: Rewrite contact/page.tsx

```tsx
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
  const qReason = sp.reason === 'quote' ? 'price_inquiry' as const
    : sp.reason === 'visit' ? 'showroom_visit' as const
    : undefined;
  const qShowroom = typeof sp.showroom === 'string' ? sp.showroom : undefined;
  const qCity = qShowroom
    ? showrooms.find((s) => s.slug === qShowroom)?.address?.city ?? undefined
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
      {/* Dark hero with text on RTL-start (right) and form on RTL-end (left) */}
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
            {/* Text col — RTL-start */}
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

            {/* Form col — RTL-end */}
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

      {/* Showrooms grid on ivory below */}
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
```

Drops imports of: Breadcrumbs, Grid, PhoneLink, ShowroomCard, Stack, mediaUrl, CentralPhoneCallout, InquiryForm. Drops the breadcrumb section, the centered title section, the CentralPhoneCallout, the fallback-phone separate section, the "showrooms دیگر" 2/3-col ShowroomCard grid, and the standalone InquiryForm section. The new layout is just: dark hero with everything → showrooms grid below.

### Step 3: Type-check + commit

```bash
pnpm --filter @zhic/web typecheck
git add apps/web/src/components/contact/ContactInquiryForm.tsx apps/web/src/app/\(site\)/contact/page.tsx
git commit -m "feat(contact): dark hero with frosted form ..."
```

---

## Task 3: QA + state.md update

```bash
curl -s -o /tmp/d4qa1.html -w "%{http_code}\n" http://localhost:8765/contact
curl -s -o /tmp/d4qa2.html -w "%{http_code}\n" http://localhost:8765/showrooms/test
pnpm --filter @zhic/web typecheck 2>&1 | grep -c "error TS"  # 4 baseline
```

Add D4 row to state.md.
