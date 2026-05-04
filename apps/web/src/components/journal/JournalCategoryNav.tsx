import { Pill } from '@zhic/ui';
import type { PayloadJournalCategory } from '@/lib/payload';
import { journalCategoryPath } from '@/lib/payload';

export type JournalCategoryNavProps = {
  categories: PayloadJournalCategory[];
  /** Currently-active category slug, or null/undefined when on the root /journal page. */
  activeSlug?: string | null;
  /** Label for the "all" pill. Defaults to "همه". */
  allLabel?: string;
};

export function JournalCategoryNav({
  categories,
  activeSlug,
  allLabel = 'همه',
}: JournalCategoryNavProps) {
  const allActive = !activeSlug;

  return (
    <div className="mb-[var(--space-7)] flex flex-nowrap gap-2 overflow-x-auto md:flex-wrap [scrollbar-width:none]">
      <Pill as="a" href="/journal" active={allActive}>
        {allLabel}
      </Pill>
      {categories.map((c) => (
        <Pill
          key={c.slug}
          as="a"
          href={journalCategoryPath(c.slug)}
          active={activeSlug === c.slug}
        >
          {c.name}
        </Pill>
      ))}
    </div>
  );
}
