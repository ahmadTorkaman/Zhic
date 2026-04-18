import type { ReactNode } from 'react';
import { Breadcrumbs, Container, Section, Stack } from '@zhic/ui';
import type { LexicalRoot } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

type Props = {
  title: string;
  body?: LexicalRoot | null;
  breadcrumbLabel: string;
  breadcrumbHref: string;
  jsonLd?: ReactNode;
};

export function LegalPageTemplate({
  title,
  body,
  breadcrumbLabel,
  breadcrumbHref,
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
      <Section padY="lg">
        <Container>
          <Stack gap="lg">
            <h1 className="text-display font-bold text-charcoal text-balance">
              {title}
            </h1>
            {body ? (
              <div className="max-w-prose">
                <RichText value={body} />
              </div>
            ) : (
              <p className="text-body text-stone">
                محتوای این صفحه به‌زودی منتشر می‌شود.
              </p>
            )}
          </Stack>
        </Container>
      </Section>
      {jsonLd}
    </>
  );
}
