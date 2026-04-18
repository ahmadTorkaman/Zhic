import type { ReactNode } from 'react';
import { Breadcrumbs, Container, Section } from '@zhic/ui';
import type { LexicalRoot } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

type Props = {
  title: string;
  body?: LexicalRoot | null;
  breadcrumbLabel: string;
  breadcrumbHref: string;
  /** Optional "آخرین به‌روزرسانی: …" date string (already formatted in Persian). */
  updated?: string;
  jsonLd?: ReactNode;
};

export function LegalPageTemplate({
  title,
  body,
  breadcrumbLabel,
  breadcrumbHref,
  updated,
  jsonLd,
}: Props) {
  return (
    <>
      <Section padY="md">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: breadcrumbLabel, href: breadcrumbHref },
            ]}
          />
        </Container>
      </Section>
      <Section padY="lg" fullBleed>
        <Container>
          <div className="mx-auto max-w-[680px]">
            <header className="mb-7">
              <h1 className="mb-3 text-h1 font-black text-ink text-balance">
                {title}
              </h1>
              {updated ? (
                <p className="text-small font-light text-stone">
                  آخرین به‌روزرسانی: {updated}
                </p>
              ) : null}
            </header>
            {body ? (
              <RichText value={body} />
            ) : (
              <p className="text-body text-stone">
                محتوای این صفحه به‌زودی منتشر می‌شود.
              </p>
            )}
          </div>
        </Container>
      </Section>
      {jsonLd}
    </>
  );
}
