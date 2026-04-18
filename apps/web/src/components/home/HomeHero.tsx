import { Button, Container, Section, Stack } from '@zhic/ui';
import type { PayloadMedia } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { WordReveal } from '@/components/motion/WordReveal';

export type HomeHeroProps = {
  heading?: string | null;
  subheading?: string | null;
  media?: PayloadMedia | null;
};

const DEFAULT_HEADING = 'ساخته‌شده برای ماندن';
const DEFAULT_SUB =
  'مبلمان دست‌ساز برای خانه‌هایی که آرامش را می‌فهمند';

export function HomeHero({ heading, subheading, media }: HomeHeroProps) {
  const src = mediaUrl(media);
  const alt = media?.alt ?? '';
  return (
    <Section fullBleed bg="ivory" padY="sm">
      <div className="relative flex min-h-[70vh] w-full items-center overflow-hidden">
        {src ? (
          <>
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-ivory/60" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-b from-ivory via-cream to-sand/30">
            <span
              className="select-none text-[28vw] font-black text-sand/50 md:text-[18vw]"
              aria-hidden
            >
              ژیک
            </span>
          </div>
        )}
        <Container>
          <Stack gap="lg" className="max-w-2xl">
            <WordReveal className="text-balance text-[clamp(2.5rem,8vw,6rem)] font-black leading-[1.1] text-charcoal">
              {heading ?? DEFAULT_HEADING}
            </WordReveal>
            <BlockReveal delay={0.3}>
              <p className="text-pretty text-lead font-light text-stone">
                {subheading ?? DEFAULT_SUB}
              </p>
            </BlockReveal>
            <BlockReveal delay={0.5}>
              <Stack direction="row" gap="sm" className="flex-wrap">
                <Button as="a" href="/products" variant="primary" size="lg">
                  مشاهده محصولات
                </Button>
                <Button as="a" href="/showrooms" variant="secondary" size="lg">
                  یافتن نزدیک‌ترین شوروم
                </Button>
              </Stack>
            </BlockReveal>
          </Stack>
        </Container>
      </div>
    </Section>
  );
}
