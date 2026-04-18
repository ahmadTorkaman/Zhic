import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { articlePageJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

const FALLBACK_TITLE = 'راهنمای نگهداری';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('care');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'راهنمای نگهداری از مبلمان چوبی و کتانی ژیک.';
  return {
    title,
    description,
    alternates: { canonical: '/care' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function CarePage() {
  const page = await fetchPage('care');
  const title = page?.title ?? FALLBACK_TITLE;
  const description = plainTextFromRichText(page?.body ?? null) ?? undefined;

  const ldCrumbs = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/care' },
    ],
    SITE_URL,
  );

  return (
    <LegalPageTemplate
      title={title}
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/care"
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCrumbs) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(articlePageJsonLd({ headline: title, url: `${SITE_URL}/care`, description })),
            }}
          />
        </>
      }
    />
  );
}
