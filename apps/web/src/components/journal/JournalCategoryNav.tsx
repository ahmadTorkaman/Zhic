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
      'inline-flex items-center rounded-pill px-4 py-1.5 text-eyebrow font-bold transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] whitespace-nowrap',
      isActive
        ? 'bg-charcoal text-ivory'
        : 'bg-cream text-charcoal hover:bg-sand',
    ].join(' ');

  return (
    <nav aria-label="دسته‌بندی‌ها" className="overflow-x-auto">
      <div className="flex gap-2">
        <Link
          href="/journal"
          className={linkClass(!activeSlug)}
          aria-current={!activeSlug ? 'true' : undefined}
        >
          همه
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={journalCategoryPath(cat.slug)}
            className={linkClass(activeSlug === cat.slug)}
            aria-current={activeSlug === cat.slug ? 'true' : undefined}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
