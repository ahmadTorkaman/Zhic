import { Aspect, Container, Section, Split, Stack } from '@zhic/ui';
import type { LexicalRoot } from '@/lib/payload';
import { RichText } from '@/lib/richtext';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { ImageReveal } from '@/components/motion/ImageReveal';

export type HomeBrandStatementProps = {
  body?: LexicalRoot | null;
};

const FALLBACK_PARAGRAPH =
  'ژیک از همدان آغاز شده است؛ از کارگاهی که در آن چوب گردو، کتان بلژیکی و دستانِ صبورِ استادکاران یک قطعه مبلمان را می‌سازند که می‌ماند.';

export function HomeBrandStatement({ body }: HomeBrandStatementProps) {
  return (
    <Section bg="cream" padY="lg">
      <Container>
        <Split ratio="40/60" gap="xl">
          <ImageReveal>
            <Aspect ratio="3/2" className="border border-sand bg-sand/40">
              <div className="flex h-full w-full items-center justify-center">
                <span className="select-none text-[10rem] font-black text-stone/25">
                  ژ
                </span>
              </div>
            </Aspect>
          </ImageReveal>
          <BlockReveal>
            <Stack gap="md">
              <p className="text-eyebrow font-bold uppercase tracking-wide text-accent">
                درباره‌ی ژیک
              </p>
              {body ? (
                <RichText value={body} />
              ) : (
                <p className="text-body leading-relaxed text-stone">
                  {FALLBACK_PARAGRAPH}
                </p>
              )}
            </Stack>
          </BlockReveal>
        </Split>
      </Container>
    </Section>
  );
}
