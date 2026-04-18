import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

const FALLBACK_TITLE = 'سیاست حریم خصوصی';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('privacy');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'سیاست حریم خصوصی شرکت ژیک.';
  return {
    title,
    description,
    alternates: { canonical: '/privacy' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function PrivacyPage() {
  const page = await fetchPage('privacy');
  const title = page?.title ?? FALLBACK_TITLE;
  const ldBreadcrumb = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/privacy' },
    ],
    SITE_URL,
  );
  return (
    <LegalPageTemplate
      title={title}
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/privacy"
      jsonLd={
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
        />
      }
    />
  );
}
