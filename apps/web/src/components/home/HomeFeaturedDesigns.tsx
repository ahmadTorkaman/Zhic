import { Container, Section, Stack } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';
import type { PayloadDesign } from '@/lib/payload';
import { plainTextFromRichText } from '@/lib/richtext';
import { PayloadImage } from '@/components/PayloadImage';

export type HomeFeaturedDesignsProps = {
  designs: PayloadDesign[];
};

const AGE_GROUP_LABEL: Record<'infant' | 'child' | 'teen' | 'adult', string> = {
  infant: 'نوزاد',
  child: 'کودک',
  teen: 'نوجوان',
  adult: 'بزرگسال',
};

type CardSize = 'lg' | 'sm';

function DesignTile({
  design,
  size,
}: {
  design: PayloadDesign;
  size: CardSize;
}) {
  const aspect = size === 'lg' ? 'aspect-[3/4]' : 'aspect-[4/5]';
  const titleClass =
    size === 'lg'
      ? 'text-h4 font-bold text-charcoal'
      : 'text-body font-bold text-charcoal';
  const ageLabel = design.age_group
    ? AGE_GROUP_LABEL[design.age_group]
    : null;
  const description = plainTextFromRichText(design.description, 120);
  return (
    <a
      href={`/designs/${design.slug}`}
      className="group block transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:translate-y-[var(--hover-lift-card)]"
    >
      <div
        className={`relative mb-4 overflow-hidden border border-transparent bg-cream transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] group-hover:border-sand group-hover:bg-ivory group-hover:shadow-card ${aspect}`}
      >
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.02]">
          <PayloadImage
            media={design.gallery?.[0] ?? null}
            alt={design.name}
          />
        </div>
      </div>
      <div className={`mb-1 ${titleClass}`}>{design.name}</div>
      {ageLabel ? (
        <div className="text-small font-light text-stone">{ageLabel}</div>
      ) : null}
      {size === 'lg' && description ? (
        <div className="mt-1 text-small font-light text-stone line-clamp-2">
          {description}
        </div>
      ) : null}
    </a>
  );
}

export function HomeFeaturedDesigns({ designs }: HomeFeaturedDesignsProps) {
  const [featured, ...rest] = designs;
  if (!featured) return null;
  const tiles = rest.slice(0, 2);

  return (
    <Section padY="xl" fullBleed>
      <Container>
        <Stack gap="lg">
          <BlockReveal>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-h2 font-black text-ink">طرح‌های ویژه</h2>
              <a
                href="/products"
                className="border-b border-sand pb-[2px] text-small text-charcoal transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:border-charcoal"
              >
                مشاهده‌ی همه
              </a>
            </div>
          </BlockReveal>

          {/* Asymmetric grid: 2fr 1fr 1fr at md+, first spans 2 rows.
              <480px: single column. 481–767px: 1fr 1fr with first full width. */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr]">
            <BlockReveal className="sm:col-span-2 md:col-span-1 md:row-span-2">
              <DesignTile design={featured} size="lg" />
            </BlockReveal>
            {tiles.map((design, idx) => (
              <BlockReveal key={design.id} delay={(idx + 1) * 0.08}>
                <DesignTile design={design} size="sm" />
              </BlockReveal>
            ))}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
