import { Container } from '@zhic/ui';
import { HorizontalTile } from '@/components/tile/HorizontalTile';
import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadArticle } from '@/lib/payload';
import { articlePath } from '@/lib/payload';
import { toPersianDigits } from '@zhic/locale';

type ArticleItem = {
  title: string;
  slug: string | null;
  category?: string;
  excerpt?: string;
  readTime?: string;
  cover?: PayloadArticle['cover'];
};

const PLACEHOLDER_ARTICLES: ArticleItem[] = [
  {
    title: 'چرا گردوی ایرانی؟ سفر یک تخته از جنگل تا کارگاه',
    slug: null,
    category: 'مواد و متریال',
    excerpt: 'جنگل‌های هیرکانی شمال ایران میزبان یکی از باارزش‌ترین گونه‌های گردو در جهان هستند.',
    readTime: '۷ دقیقه مطالعه',
  },
  {
    title: 'مینیمالیسم ایرانی: کم‌تر، اما باشکوه‌تر',
    slug: null,
    category: 'طراحی',
    readTime: '۷ دقیقه مطالعه',
  },
  {
    title: 'راهنمای نگهداری از مبلمان چوبی در فصل گرما',
    slug: null,
    category: 'مراقبت',
    readTime: '۵ دقیقه مطالعه',
  },
];

function readTimeLabel(minutes: number | null | undefined): string | undefined {
  if (!minutes) return undefined;
  return `${toPersianDigits(minutes)} دقیقه مطالعه`;
}

export type HomeJournalTeaserProps = {
  articles: PayloadArticle[];
  heading?: string;
  viewAllHref?: string;
};

export function HomeJournalTeaser({
  articles,
  heading = 'از ژورنال',
  viewAllHref = '/journal',
}: HomeJournalTeaserProps) {
  const items: ArticleItem[] = articles.length > 0
    ? articles.slice(0, 3).map((a) => ({
        title: a.title,
        slug: a.slug,
        category: a.category?.name,
        excerpt: a.excerpt ?? undefined,
        readTime: readTimeLabel(a.readingTimeMinutes),
        cover: a.cover,
      }))
    : PLACEHOLDER_ARTICLES;

  const featured = items[0];
  const smalls = items.slice(1, 3);

  return (
    <section className="bg-ivory py-[var(--space-11)]">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-h2 font-black text-ink">{heading}</h2>
          <a
            href={viewAllHref}
            className="border-b border-sand pb-[2px] text-small text-charcoal transition-colors duration-[var(--dur-hover)] hover:border-charcoal"
          >
            مشاهده‌ی همه
          </a>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-7)] md:grid-cols-2">
          {/* Featured article */}
          {featured ? (
            <a
              href={featured.slug ? articlePath(featured.slug) : '#'}
              className="group block md:row-span-2"
            >
              <div className="relative mb-5 aspect-[3/4] overflow-hidden bg-cream">
                <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
                  <PayloadImage
                    media={featured.cover ?? null}
                    alt={featured.title}
                    fallbackText="تصویر مقاله"
                  />
                </div>
              </div>
              {featured.category ? (
                <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest">
                  {featured.category}
                </div>
              ) : null}
              <h3 className="mb-0 text-h3 font-bold leading-[1.3] text-charcoal">
                {featured.title}
              </h3>
              {featured.excerpt ? (
                <p className="mt-3 text-small font-light leading-[var(--leading-lead)] text-stone">
                  {featured.excerpt}
                </p>
              ) : null}
            </a>
          ) : null}

          {/* Small articles */}
          <div className="flex flex-col gap-[var(--space-6)]">
            {smalls.map((article, i) => (
              <HorizontalTile
                key={i}
                href={article.slug ? articlePath(article.slug) : '#'}
                image={
                  <PayloadImage
                    media={article.cover ?? null}
                    alt={article.title}
                    fallbackText="تصویر"
                  />
                }
                imageWidth={160}
                eyebrow={article.category}
                title={article.title}
                meta={article.readTime}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
