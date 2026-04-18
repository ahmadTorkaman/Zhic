import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { articlePageJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

const FALLBACK_TITLE = 'شرایط مرجوعی';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('returns');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'شرایط مرجوعی و بازگشت کالا در ژیک.';
  return {
    title,
    description,
    alternates: { canonical: '/returns' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function ReturnsPage() {
  const page = await fetchPage('returns');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'شرایط مرجوعی و بازگشت کالا در ژیک.';
  const ldArticle = articlePageJsonLd({
    headline: title,
    url: `${SITE_URL}/returns`,
    description,
  });
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/returns' },
    ],
    SITE_URL,
  );
  return (
    <LegalPageTemplate
      title={title}
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/returns"
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
