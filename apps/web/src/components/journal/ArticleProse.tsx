import { ArticleRichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';

export type ArticleProseProps = {
  value: LexicalRoot | null | undefined;
};

export function ArticleProse({ value }: ArticleProseProps) {
  return (
    <div className="mx-auto max-w-[680px] text-body leading-[1.85] text-charcoal">
      <ArticleRichText value={value} />
    </div>
  );
}
