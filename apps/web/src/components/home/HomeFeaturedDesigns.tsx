import { Container } from '@zhic/ui';
import { Tile } from '@/components/tile/Tile';
import { PayloadImage } from '@/components/PayloadImage';
import type { PayloadDesign, PayloadMedia } from '@/lib/payload';
import { productPath } from '@/lib/payload';

type FeaturedItem = {
  name: string;
  slug?: string;
  meta?: string;
  badge?: string;
  cover?: PayloadMedia | null;
};

const PLACEHOLDER_DESIGNS: FeaturedItem[] = [
  { name: 'میز ناهارخوری آرتا', meta: 'چوب گردو · دست‌ساز', badge: 'جدید' },
  { name: 'صندلی راحتی پارسا', meta: 'چوب بلوط · مدرن' },
  { name: 'تخت خواب دیبا', meta: 'چوب گردو · کلاسیک' },
];

export type HomeFeaturedDesignsProps = {
  designs: PayloadDesign[];
  heading?: string;
  viewAllHref?: string;
};

export function HomeFeaturedDesigns({
  designs,
  heading = 'طرح‌های ویژه',
  viewAllHref = '/products',
}: HomeFeaturedDesignsProps) {
  const items: FeaturedItem[] = designs.length > 0
    ? designs.slice(0, 3).map((d, i) => ({
        name: d.name,
        slug: d.slug,
        meta: undefined,
        badge: i === 0 ? 'جدید' : undefined,
        cover: d.gallery?.[0] ?? null,
      }))
    : PLACEHOLDER_DESIGNS;

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

        <div className="grid grid-cols-1 gap-[var(--space-5)] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
          {items.map((item, i) => {
            const href = item.slug ? productPath(item.slug) : '#';
            const image = (
              <PayloadImage
                media={item.cover ?? null}
                alt={item.name}
                fallbackText="تصویر به‌زودی"
              />
            );
            if (i === 0) {
              return (
                <Tile
                  key={i}
                  href={href}
                  image={image}
                  aspect="3/4"
                  title={item.name}
                  titleSize="h4"
                  meta={item.meta}
                  badge={item.badge}
                  hover="full"
                  className="md:row-span-2"
                />
              );
            }
            return (
              <Tile
                key={i}
                href={href}
                image={image}
                aspect="4/5"
                title={item.name}
                meta={item.meta}
                hover="full"
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}
