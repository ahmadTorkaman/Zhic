import { Button, Container, Section, Stack } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';

export type HomeInquiryCtaProps = {
  heading?: string | null;
};

const DEFAULT_HEADING = 'با ما در تماس باشید';
const SUBTITLE =
  'برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید، یک پیام برای ما بفرستید.';

export function HomeInquiryCta({ heading }: HomeInquiryCtaProps) {
  return (
    <Section bg="ink" padY="xl">
      <Container>
        <BlockReveal>
          <Stack gap="md" align="center" className="text-center">
            <h2 className="max-w-2xl text-h2 font-bold text-ivory text-balance">
              {heading ?? DEFAULT_HEADING}
            </h2>
            <p className="max-w-xl text-lead text-ivory/70">{SUBTITLE}</p>
            <Button
              as="a"
              href="/contact"
              variant="secondary"
              size="lg"
              className="border-ivory text-ivory hover:bg-ivory hover:text-ink"
            >
              تماس با ژیک
            </Button>
          </Stack>
        </BlockReveal>
      </Container>
    </Section>
  );
}
