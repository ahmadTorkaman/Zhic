import { ArticleRichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';

/** Long-form SEO content block below the tiles (CMS «محتوای صفحه»). Renders
 *  nothing when empty. The SEO specialist writes headings / paragraphs / links;
 *  ArticleRichText serializes the lexical value, this wraps it for the 430
 *  column with an optional section heading. */
export type OccupancyContentProps = {
  value: LexicalRoot | null | undefined;
  heading?: string;
};

export function OccupancyContent({ value, heading }: OccupancyContentProps) {
  if (!value?.root?.children?.length) return null;
  return (
    <section
      className={[
        'px-[22px] text-[3.4cqw] leading-[1.95] text-charcoal',
        '[&_h2]:mt-[18px] [&_h2]:mb-[8px] [&_h2]:text-[4.4cqw] [&_h2]:font-bold [&_h2]:text-ink',
        '[&_h3]:mt-[14px] [&_h3]:mb-[6px] [&_h3]:text-[3.9cqw] [&_h3]:font-bold [&_h3]:text-ink',
        '[&_p]:mt-[8px] [&_a]:text-forest [&_a]:underline',
        '[&_ul]:mt-[8px] [&_ul]:pr-[18px] [&_ul]:list-disc [&_li]:mt-[4px]',
      ].join(' ')}
    >
      {heading ? (
        <h2 className="mb-[10px] text-center text-[4.7cqw] font-bold leading-[1.4] text-ink">{heading}</h2>
      ) : null}
      <ArticleRichText value={value} />
    </section>
  );
}
