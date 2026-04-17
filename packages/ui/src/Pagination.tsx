import { cn } from './cn';

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  formatPage?: (page: number) => string;
  className?: string;
};

function pageRange(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('gap');
  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  hrefFor,
  formatPage,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const display = formatPage ?? String;
  const pages = pageRange(currentPage, totalPages);

  return (
    <nav aria-label="صفحه‌بندی" className={cn('flex items-center justify-center gap-1', className)}>
      {currentPage > 1 && (
        <a
          href={hrefFor(currentPage - 1)}
          rel="prev"
          aria-label="صفحه‌ی قبل"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-stone transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-cream hover:text-charcoal focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="rtl:-scale-x-100">
            <path d="M10 4 L6 8 L10 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}

      {pages.map((item, idx) =>
        item === 'gap' ? (
          <span key={`gap-${idx}`} className="px-1 text-stone" aria-hidden>
            …
          </span>
        ) : (
          <a
            key={item}
            href={hrefFor(item)}
            aria-label={`صفحه‌ی ${display(item)}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-small tabular-nums',
              'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
              'focus-visible:outline-none',
              item === currentPage
                ? 'bg-charcoal text-ivory font-bold'
                : 'text-stone hover:bg-cream hover:text-charcoal',
            )}
          >
            {display(item)}
          </a>
        ),
      )}

      {currentPage < totalPages && (
        <a
          href={hrefFor(currentPage + 1)}
          rel="next"
          aria-label="صفحه‌ی بعد"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-stone transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-cream hover:text-charcoal focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="rtl:-scale-x-100">
            <path d="M6 4 L10 8 L6 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </nav>
  );
}
