import { PayloadImage } from '@/components/PayloadImage';
import { RichText } from '@/lib/richtext';
import type { PayloadAuthor } from '@/lib/payload';

export type AuthorCardProps = {
  author: PayloadAuthor;
};

export function AuthorCard({ author }: AuthorCardProps) {
  const hasAvatarMedia =
    author.avatar != null && typeof author.avatar === 'object' && 'url' in author.avatar;

  const avatarNode = hasAvatarMedia ? (
    <PayloadImage media={author.avatar!} alt={author.name} />
  ) : (
    author.name.trim().slice(0, 1)
  );

  const bioNode = author.bio ? <RichText value={author.bio} /> : null;

  return (
    <aside className="flex items-start gap-[var(--space-5)] rounded-lg border border-sand p-6">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-sand flex items-center justify-center text-h4 font-bold text-charcoal">
        {avatarNode}
      </div>
      <div>
        <div className="text-h4 font-bold text-charcoal">{author.name}</div>
        {author.role ? (
          <div className="text-small text-stone">{author.role}</div>
        ) : null}
        {bioNode ? (
          <div className="mt-1 text-small font-light leading-[1.7] text-stone">{bioNode}</div>
        ) : null}
      </div>
    </aside>
  );
}
