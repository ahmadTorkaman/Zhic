import type { Metadata } from 'next';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import { fetchFaq } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { SITE_URL } from '@/lib/env';
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/jsonld';
import { FaqAccordion } from '@/components/faq/FaqAccordion';

const FALLBACK_TITLE = 'سوالات متداول';

export async function generateMetadata(): Promise<Metadata> {
  const faq = await fetchFaq();
  const title = faq?.title ?? FALLBACK_TITLE;
  return {
    title,
    description: 'پاسخ به سوالات متداول درباره‌ی محصولات، سفارش و ارسال ژیک.',
    alternates: { canonical: '/faq' },
    openGraph: {
      type: 'website',
      title,
      description: 'پاسخ به سوالات متداول درباره‌ی محصولات، سفارش و ارسال ژیک.',
    },
  };
}

export default async function FaqPage() {
  const faq = await fetchFaq();
  const title = faq?.title ?? FALLBACK_TITLE;
  const items = faq?.items ?? [];

  const ldCrumbs = breadcrumbJsonLd(
    [
      { name: 'خانه', url: '/' },
      { name: title, url: '/faq' },
    ],
    SITE_URL,
  );

  const faqLdItems = items.map((it) => ({
    question: it.question,
    answer: plainTextFromRichText(it.answer, 500) ?? '',
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldCrumbs) }}
      />
      {faqLdItems.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(faqLdItems)) }}
        />
      ) : null}

      <Section padY="md">
        <Container>
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: title }]} />
        </Container>
      </Section>

      <Section padY="lg">
        <Container>
          <Stack gap="lg">
            <h1 className="text-display font-bold text-charcoal text-balance">
              {title}
            </h1>
            <div className="max-w-prose">
              <FaqAccordion items={items} />
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
