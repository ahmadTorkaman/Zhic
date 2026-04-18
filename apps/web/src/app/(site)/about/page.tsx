import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { aboutPageJsonLd, breadcrumbJsonLd, organizationJsonLd } from '@/lib/jsonld';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

const FALLBACK_TITLE = 'درباره ژیک';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('about');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'داستان برند ژیک — مبلمان دست‌ساز از همدان.';
  return {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function AboutPage() {
  const page = await fetchPage('about');
  const title = page?.title ?? FALLBACK_TITLE;
  const description = plainTextFromRichText(page?.body ?? null) ?? undefined;

  const ldCrumbs = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/about' },
    ],
    SITE_URL,
  );

  return (
    <LegalPageTemplate
      title={title}
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/about"
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCrumbs) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(aboutPageJsonLd({ name: title, url: `${SITE_URL}/about`, description })),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationJsonLd({ name: 'Zhic', url: SITE_URL, description: 'مبلمان دست‌ساز ایرانی' })),
            }}
          />
        </>
      }
    />
  );
}
