import type { ReactNode } from 'react';
import { Breadcrumbs, Container, Section } from '@zhic/ui';
import type { LexicalRoot } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

type Props = {
  title: string;
  eyebrow?: string;
  body?: LexicalRoot | null;
  breadcrumbLabel: string;
  breadcrumbHref: string;
  /** Optional inline content rendered between the lead and rest of body — used for B5 Atelier image grid. */
  inlineSlot?: ReactNode;
  jsonLd?: ReactNode;
};

export function EditorialPageTemplate({
  title,
  eyebrow,
  body,
  breadcrumbLabel,
  breadcrumbHref,
  inlineSlot,
  jsonLd,
}: Props) {
  return (
    <>
      {/* Sticky breadcrumb */}
      <div className="sticky top-0 z-10 border-b border-sand/40 bg-ivory/90 backdrop-blur">
        <Container>
          <div className="py-3">
            <Breadcrumbs
              items={[
                { label: 'خانه', href: '/' },
                { label: breadcrumbLabel, href: breadcrumbHref },
              ]}
            />
          </div>
        </Container>
      </div>

      {/* Full-bleed hero — cream surface with forest eyebrow + h1 overlaid at bottom.
          Future enhancement: when PayloadStaticPage gains a cover field, render the
          cover image with bottom-gradient overlay (matches A4-B / D3 article hero). */}
      <div className="relative mb-8 min-h-[40vh] overflow-hidden bg-cream">
        <div className="absolute inset-x-0 bottom-0 pb-7">
          <Container>
            <div className="max-w-[680px]">
              {eyebrow ? (
                <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.1em] text-forest">
                  {eyebrow}
                </div>
              ) : null}
              <h1 className="text-h1 font-black text-ink text-balance">{title}</h1>
            </div>
          </Container>
        </div>
      </div>

      {/* Centered prose body */}
      <Section padY="lg" fullBleed>
        <Container>
          <div className="mx-auto max-w-[680px]">
            {body ? (
              <RichText value={body} />
            ) : (
              <p className="text-body text-stone">
                محتوای این صفحه به‌زودی منتشر می‌شود.
              </p>
            )}
            {inlineSlot ? <div className="mt-8">{inlineSlot}</div> : null}
          </div>
        </Container>
      </Section>

      {jsonLd}
    </>
  );
}
