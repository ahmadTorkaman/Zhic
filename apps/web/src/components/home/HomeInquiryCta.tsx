import { Container, Section } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { HomeInquiryForm } from './HomeInquiryForm';

export type HomeInquiryCtaProps = {
  heading?: string | null;
};

const DEFAULT_HEADING = 'با ما در تماس باشید';
const SUBTITLE =
  'برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید. تیم ما آماده‌ی پاسخ‌گویی است.';

export function HomeInquiryCta({ heading }: HomeInquiryCtaProps) {
  return (
    <Section bg="ink" padY="xl" fullBleed className="relative overflow-hidden">
      {/* Decorative radial forest glow at top-end (RTL) corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[200px] -end-[200px] h-[600px] w-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-forest) 5%, transparent) 0%, transparent 70%)',
        }}
      />
      <Container>
        <div className="relative grid grid-cols-1 items-center gap-9 md:grid-cols-2 md:gap-10">
          {/* Text column */}
          <BlockReveal>
            <div className="text-center md:text-start">
              <span
                aria-hidden
                className="mx-auto mb-6 block h-[2px] w-12 bg-gold md:mx-0"
              />
              <h2 className="mb-4 text-h2 font-black leading-[var(--leading-h2)] text-ivory">
                {heading ?? DEFAULT_HEADING}
              </h2>
              <p className="mb-6 max-w-[420px] text-body font-light leading-[1.85] text-sand md:mx-0 mx-auto">
                {SUBTITLE}
              </p>
              <a
                href="/showrooms"
                className="hidden items-center rounded-md border border-ivory/15 bg-transparent px-9 py-[15px] text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:border-gold hover:text-gold focus-ring-invert md:inline-flex"
              >
                مشاهده‌ی شوروم‌ها
              </a>
            </div>
          </BlockReveal>

          {/* Form column */}
          <BlockReveal delay={0.15}>
            <HomeInquiryForm />
          </BlockReveal>
        </div>
      </Container>
    </Section>
  );
}
