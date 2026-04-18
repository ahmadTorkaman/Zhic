import type { PayloadAuthor } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

export function AuthorCard({ author }: { author: PayloadAuthor }) {
  const avatarSrc = mediaUrl(author.avatar ?? null);

  return (
    <div className="flex gap-4 rounded-lg border border-sand p-5 md:p-6">
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={author.name}
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sand text-h3 font-bold text-charcoal">
          {author.name.charAt(0)}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-h4 font-bold text-charcoal">{author.name}</p>
        {author.role ? (
          <p className="text-small text-stone">{author.role}</p>
        ) : null}
        {author.bio ? (
          <div className="mt-1 text-small text-stone line-clamp-3">
            <RichText value={author.bio} />
          </div>
        ) : null}

        {author.social ? (
          <div className="mt-2 flex gap-3 text-small">
            {author.social.instagram ? (
              <a
                href={`https://instagram.com/${author.social.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="text-stone hover:text-charcoal"
              >
                اینستاگرام
              </a>
            ) : null}
            {author.social.telegram ? (
              <a
                href={`https://t.me/${author.social.telegram}`}
                target="_blank"
                rel="noreferrer"
                className="text-stone hover:text-charcoal"
              >
                تلگرام
              </a>
            ) : null}
            {author.social.website ? (
              <a
                href={author.social.website}
                target="_blank"
                rel="noreferrer"
                className="text-stone hover:text-charcoal"
              >
                وب‌سایت
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
