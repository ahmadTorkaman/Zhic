import { Container, DesignCard, Grid, Section, Stack } from '@zhic/ui';
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

export function HomeFeaturedDesigns({ designs }: HomeFeaturedDesignsProps) {
  if (designs.length === 0) return null;
  return (
    <Section padY="lg">
      <Container>
        <Stack gap="lg">
          <BlockReveal>
            <Stack gap="xs">
              <h2 className="text-h2 font-bold text-charcoal">طرح‌های ویژه</h2>
              <p className="text-lead text-stone">
                مجموعه‌ای از خانواده‌های طراحی ژیک، برای هر سن و هر خانه.
              </p>
            </Stack>
          </BlockReveal>
          <Grid columns={3} gap="lg">
            {designs.map((design, idx) => (
              <BlockReveal key={design.id} delay={idx * 0.08}>
                <DesignCard
                  href={`/designs/${design.slug}`}
                  name={design.name}
                  ageGroupLabel={
                    design.age_group ? AGE_GROUP_LABEL[design.age_group] : undefined
                  }
                  description={plainTextFromRichText(design.description, 120)}
                  image={<PayloadImage media={design.gallery?.[0] ?? null} alt={design.name} />}
                />
              </BlockReveal>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
