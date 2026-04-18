import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

const FALLBACK_TITLE = 'شرایط استفاده';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('terms');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'شرایط و قوانین استفاده از خدمات ژیک.';
  return {
    title,
    description,
    alternates: { canonical: '/terms' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function TermsPage() {
  const page = await fetchPage('terms');
  const title = page?.title ?? FALLBACK_TITLE;
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/terms' },
    ],
    SITE_URL,
  );
  return (
    <LegalPageTemplate
      title={title}
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/terms"
      jsonLd={
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
        />
      }
    />
  );
}
