import type { ReactNode } from 'react';
import { toPersianDigits } from '@zhic/locale';
import { Aspect } from './Aspect';
import { cn } from './cn';
import { DateDisplay } from './DateDisplay';
import { CARD_BASE, CARD_INTERACTIVE, CARD_IMAGE_ZOOM } from './cardClasses';

export type ArticleCardProps = {
  href?: string;
  title: ReactNode;
  cover: ReactNode;
  excerpt?: ReactNode;
  author?: ReactNode;
  publishedAt?: string | Date;
  readingTimeMinutes?: number;
  categoryLabel?: ReactNode;
  className?: string;
};

const DOT = '\u00B7';

export function ArticleCard({
  href,
  title,
  cover,
  excerpt,
  author,
  publishedAt,
  readingTimeMinutes,
  categoryLabel,
  className,
}: ArticleCardProps) {
  const rootClass = cn(CARD_BASE, href ? CARD_INTERACTIVE : null, className);
  const metaParts: ReactNode[] = [];
  if (author) metaParts.push(<span key="author">{author}</span>);
  if (publishedAt)
    metaParts.push(<DateDisplay key="date" value={publishedAt} />);
  if (typeof readingTimeMinutes === 'number')
    metaParts.push(
      <span key="read">{toPersianDigits(readingTimeMinutes)} دقیقه مطالعه</span>,
    );

  const body = (
    <>
      <Aspect ratio="3/2" className={cn('bg-cream', CARD_IMAGE_ZOOM)}>
        {cover}
      </Aspect>
      <div className="flex flex-col gap-3 p-4 md:p-5">
        {categoryLabel ? (
          <p className="text-eyebrow font-bold tracking-wide text-accent">
            {categoryLabel}
          </p>
        ) : null}
        <h3 className="text-h4 font-bold text-balance line-clamp-2">
          {title}
        </h3>
        {excerpt ? (
          <p className="text-body text-stone line-clamp-3">{excerpt}</p>
        ) : null}
        {metaParts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-small text-stone">
            {metaParts.map((part, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                {idx > 0 ? (
                  <span aria-hidden className="text-stone/60">
                    {DOT}
                  </span>
                ) : null}
                {part}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rootClass}>
        {body}
      </a>
    );
  }
  return <article className={rootClass}>{body}</article>;
}
