import { Container } from '@zhic/ui';
import { ArticleRichText } from '@/lib/richtext';
import { EditorialHero } from '@/components/hero/EditorialHero';
import type { LexicalRoot } from '@/lib/payload';

export type EditorialPageProps = {
  /** Eyebrow shown above H1 on the hero. */
  eyebrow: string;
  /** H1 shown inside the hero overlay. */
  heading: string;
  /** Hero height token. Default 'lg'. */
  heroHeight?: 'sm' | 'md' | 'lg' | 'xl';
  /** Rich body. */
  body: LexicalRoot | null | undefined;
  /** Optional lead/subtitle paragraph rendered in large light stone, before the body. */
  lead?: string | null;
};

export function EditorialPage({
  eyebrow,
  heading,
  heroHeight = 'lg',
  body,
  lead,
}: EditorialPageProps) {
  return (
    <>
      <EditorialHero eyebrow={eyebrow} title={heading} height={heroHeight} />
      <section className="py-[var(--space-9)]">
        <Container>
          <div className="mx-auto max-w-[680px]">
            {lead ? (
              <p className="mb-[var(--space-7)] text-lead font-light text-stone">{lead}</p>
            ) : null}
            <div className="text-body leading-[1.85] text-charcoal">
              <ArticleRichText value={body} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
