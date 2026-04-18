import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { articlePageJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

const FALLBACK_TITLE = 'ارسال و تحویل';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('shipping');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'شرایط ارسال، زمان تحویل و هزینه‌ی حمل‌ونقل در ژیک.';
  return {
    title,
    description,
    alternates: { canonical: '/shipping-and-delivery' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function ShippingPage() {
  const page = await fetchPage('shipping');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'شرایط ارسال، زمان تحویل و هزینه‌ی حمل‌ونقل در ژیک.';
  const ldArticle = articlePageJsonLd({
    headline: title,
    url: `${SITE_URL}/shipping-and-delivery`,
    description,
  });
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/shipping-and-delivery' },
    ],
    SITE_URL,
  );
  return (
    <LegalPageTemplate
      title={title}
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/shipping-and-delivery"
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldArticle) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
          />
        </>
      }
    />
  );
}
