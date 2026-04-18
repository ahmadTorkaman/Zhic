import type { Metadata } from 'next';
import { fetchPage } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, placeJsonLd } from '@/lib/jsonld';
import { EditorialPageTemplate } from '@/components/legal/EditorialPageTemplate';

const FALLBACK_TITLE = 'کارگاه ژیک';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage('atelier');
  const title = page?.title ?? FALLBACK_TITLE;
  const description =
    plainTextFromRichText(page?.body ?? null) ??
    'کارگاه مبلمان‌سازی ژیک در همدان.';
  return {
    title,
    description,
    alternates: { canonical: '/atelier' },
    openGraph: { type: 'website', title, description },
  };
}

export default async function AtelierPage() {
  const page = await fetchPage('atelier');
  const title = page?.title ?? FALLBACK_TITLE;
  const description = plainTextFromRichText(page?.body ?? null) ?? undefined;

  const ldCrumbs = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/atelier' },
    ],
    SITE_URL,
  );

  return (
    <EditorialPageTemplate
      title={title}
      eyebrow="کارگاه ژیک"
      body={page?.body ?? null}
      breadcrumbLabel={title}
      breadcrumbHref="/atelier"
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCrumbs) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(placeJsonLd({ name: title, url: `${SITE_URL}/atelier`, description })),
            }}
          />
        </>
      }
    />
  );
}
