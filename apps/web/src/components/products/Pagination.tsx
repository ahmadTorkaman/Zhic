import { toPersianDigits } from '@zhic/locale';
import type { SearchParamsRecord } from '@/lib/products';
import { buildQueryString } from '@/lib/products';

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: SearchParamsRecord;
};

function pageHrefs(currentPage: number, totalPages: number): (number | 'gap')[] {
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
  // Under RTL, "next" advances visually to the LEFT; "prev" to the right.
  // Glyph itself is mirrored in CSS to match.
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

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: Props) {
  if (totalPages <= 1) return null;

  const linkFor = (page: number) =>
    `${basePath}${buildQueryString(searchParams, {
      page: page === 1 ? null : page,
    })}`;

  const items = pageHrefs(currentPage, totalPages);
  const prev = currentPage > 1 ? linkFor(currentPage - 1) : null;
  const next = currentPage < totalPages ? linkFor(currentPage + 1) : null;

  return (
    <nav
      aria-label="صفحه‌بندی"
      className="mt-9 flex items-center justify-center gap-2 text-body"
    >
      {prev ? (
        <a
          href={prev}
          rel="prev"
          aria-label="صفحه‌ی قبل"
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-charcoal hover:bg-sand/60 focus-visible:outline-none"
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
        {items.map((it, idx) =>
          it === 'gap' ? (
            <li key={`gap-${idx}`} className="px-2 text-stone" aria-hidden>
              …
            </li>
          ) : it === currentPage ? (
            <li key={it}>
              <span
                aria-current="page"
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-charcoal px-3 text-ivory"
              >
                {toPersianDigits(it)}
              </span>
            </li>
          ) : (
            <li key={it}>
              <a
                href={linkFor(it)}
                aria-label={`صفحه‌ی ${toPersianDigits(it)}`}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-charcoal hover:bg-sand/60 focus-visible:outline-none"
              >
                {toPersianDigits(it)}
              </a>
            </li>
          ),
        )}
      </ol>
      {next ? (
        <a
          href={next}
          rel="next"
          aria-label="صفحه‌ی بعد"
          className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-charcoal hover:bg-sand/60 focus-visible:outline-none"
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
