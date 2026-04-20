import { Container, Breadcrumbs } from '@zhic/ui';
import { DarkSplitHero } from '@/components/hero/DarkSplitHero';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { fetchContact, fetchAllShowrooms } from '@/lib/payload';

const DEFAULT_CITIES = ['تهران', 'اصفهان', 'همدان', 'مشهد', 'شیراز', 'تبریز', 'سایر شهرها'];

export function generateMetadata() {
  return {
    title: 'تماس با ما',
    description: 'برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید.',
  };
}

export default async function ContactPage() {
  const [contact, showrooms] = await Promise.all([
    fetchContact(),
    fetchAllShowrooms(),
  ]);

  // Cities list: union of showroom cities + fallback cities + "سایر شهرها" last.
  const showroomCities = showrooms
    .map((s) => s.address?.city)
    .filter((c): c is string => Boolean(c));
  const merged = Array.from(new Set([...showroomCities, ...DEFAULT_CITIES]));
  const cities = [
    ...merged.filter((c) => c !== 'سایر شهرها'),
    'سایر شهرها',
  ];

  const title = contact?.title ?? 'با ما در تماس باشید';
  const lead =
    contact?.address ??
    'برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید. تیم ما آماده‌ی پاسخ‌گویی است.';

  return (
    <>
      <Container>
        <div className="pt-6">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'تماس' }]} />
        </div>
      </Container>

      <DarkSplitHero
        variant="page"
        title={title}
        lead={lead}
        contact={{
          phone: contact?.phone ?? '۰۸۱-۳۴۲۵ ۶۷۸۹',
          email: contact?.email ?? 'info@zhicwood.com',
        }}
        hours={{ text: 'شنبه تا پنجشنبه · ۰۹:۰۰ – ۱۷:۰۰' }}
      >
        <InquiryForm cities={cities} />
      </DarkSplitHero>

      <div className="pb-12" />
    </>
  );
}
