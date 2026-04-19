import { toPersianDigits } from '@zhic/locale';

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  /** Function that returns the href for a given page number. Page 1 should typically omit the ?page param. */
  hrefFor: (page: number) => string;
  className?: string;
};

function range(currentPage: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push('gap');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('gap');
  pages.push(totalPages);
  return pages;
}

function Arrow({ direction }: { direction: 'prev' | 'next' }) {
  // Under RTL, "next" advances visually to the LEFT; arrow glyph mirrored to match.
  const flip = direction === 'next' ? '-scale-x-100' : '';
  return (
    <svg
      viewBox="0 0 8 14"
      width="10"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className={`inline-block ${flip}`}
    >
      <path d="M7 1 L1 7 L7 13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Pagination({ currentPage, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = range(currentPage, totalPages);
  const prev = currentPage > 1 ? hrefFor(currentPage - 1) : null;
  const next = currentPage < totalPages ? hrefFor(currentPage + 1) : null;

  return (
    <nav aria-label="صفحه‌بندی" className={`mt-9 flex items-center justify-center gap-2 text-body ${className ?? ''}`}>
      {prev ? (
        <a
          href={prev}
          rel="prev"
          aria-label="صفحه‌ی قبل"
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-charcoal transition-colors duration-[var(--dur-hover)] hover:bg-sand/60"
        >
          <Arrow direction="prev" />
          <span>قبلی</span>
        </a>
      ) : (
        <span className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-stone opacity-40">
          <Arrow direction="prev" />
          <span>قبلی</span>
        </span>
      )}
      <ol className="inline-flex items-center gap-1">
        {items.map((item, idx) =>
          item === 'gap' ? (
            <li key={`gap-${idx}`} className="px-2 text-stone" aria-hidden>…</li>
          ) : item === currentPage ? (
            <li key={item}>
              <span
                aria-current="page"
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-charcoal px-3 text-ivory"
              >
                {toPersianDigits(item)}
              </span>
            </li>
          ) : (
            <li key={item}>
              <a
                href={hrefFor(item)}
                aria-label={`صفحه‌ی ${toPersianDigits(item)}`}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-charcoal transition-colors duration-[var(--dur-hover)] hover:bg-sand/60"
              >
                {toPersianDigits(item)}
              </a>
            </li>
          )
        )}
      </ol>
      {next ? (
        <a
          href={next}
          rel="next"
          aria-label="صفحه‌ی بعد"
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-charcoal transition-colors duration-[var(--dur-hover)] hover:bg-sand/60"
        >
          <span>بعدی</span>
          <Arrow direction="next" />
        </a>
      ) : (
        <span className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-stone opacity-40">
          <span>بعدی</span>
          <Arrow direction="next" />
        </span>
      )}
    </nav>
  );
}
