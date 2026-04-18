import Link from 'next/link';
import type { PayloadJournalCategory } from '@/lib/payload';
import { journalCategoryPath } from '@/lib/payload';

export function JournalCategoryNav({
  categories,
  activeSlug,
}: {
  categories: PayloadJournalCategory[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  const linkClass = (isActive: boolean) =>
    [
      'inline-block rounded-full px-4 py-2 text-small font-medium transition-colors whitespace-nowrap',
      isActive
        ? 'bg-charcoal text-ivory'
        : 'bg-sand/40 text-charcoal hover:bg-sand',
    ].join(' ');

  return (
    <nav aria-label="دسته‌بندی‌ها" className="overflow-x-auto">
      <div className="flex gap-2">
        <Link href="/journal" className={linkClass(!activeSlug)}>
          همه
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={journalCategoryPath(cat.slug)}
            className={linkClass(activeSlug === cat.slug)}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
