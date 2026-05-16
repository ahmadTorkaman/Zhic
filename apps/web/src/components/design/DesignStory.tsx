import { ArticleRichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';

export type DesignStoryProps = {
  blocks: LexicalRoot | null;
};

export function DesignStory({ blocks }: DesignStoryProps) {
  // Skip the section wrapper entirely when there's no content.
  // ArticleRichText also returns null internally, but the wrapper would still
  // render an empty <section> with padding, which we don't want.
  if (!blocks?.root?.children?.length) return null;

  return (
    <section className="mx-auto w-full max-w-[680px] px-4 pb-12">
      <ArticleRichText value={blocks} />
    </section>
  );
}
