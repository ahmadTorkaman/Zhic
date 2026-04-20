import { Container, Breadcrumbs } from '@zhic/ui';
import { ArticleRichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';

export type LegalPageProps = {
  heading: string;
  /** Display string like "۱ فروردین ۱۴۰۵". Parent formats. */
  updatedLabel?: string | null;
  body: LexicalRoot | null | undefined;
  /** Breadcrumb items excluding the home root. E.g. [{label: 'حریم خصوصی'}]. */
  breadcrumbItems: Array<{ label: string; href?: string }>;
};

export function LegalPage({ heading, updatedLabel, body, breadcrumbItems }: LegalPageProps) {
  return (
    <section className="py-[var(--space-7)]">
      <Container>
        <Breadcrumbs items={[{ label: 'خانه', href: '/' }, ...breadcrumbItems]} />

        <header className="mt-6 mb-7 border-b border-sand pb-6">
          <h1 className="mb-3 text-h2 font-black text-ink">{heading}</h1>
          {updatedLabel ? (
            <p className="text-small font-light text-stone">آخرین به‌روزرسانی: {updatedLabel}</p>
          ) : null}
        </header>

        <div className="max-w-[680px] pb-[var(--space-9)]">
          <div className="text-body leading-[1.85] text-charcoal [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:text-h3 [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-h4 [&_h3]:font-bold [&_h3]:text-charcoal [&_li]:mb-3 [&_li]:leading-[1.75] [&_p]:mb-5 [&_p]:leading-[1.85] [&_ul]:mb-5 [&_ul]:ps-5">
            <ArticleRichText value={body} />
          </div>
        </div>
      </Container>
    </section>
  );
}
