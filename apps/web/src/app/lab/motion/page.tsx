import { Container, Section, Stack } from '@zhic/ui';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { WordReveal } from '@/components/motion/WordReveal';
import { ImageReveal } from '@/components/motion/ImageReveal';

export default function MotionLab() {
  return (
    <>
      <Section padY="lg">
        <Container>
          <Stack gap="xl">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-accent">
                Lab · Motion
              </p>
              <h1 className="text-h1 font-bold text-charcoal">
                آزمایشگاه حرکت
              </h1>
              <p className="mt-4 text-body text-stone">
                الگوهای حرکتی پیاده‌سازی‌شده. برای تست
                {' '}<code>prefers-reduced-motion</code>، تنظیمات
                مرورگر را تغییر دهید.
              </p>
            </div>

            <Stack gap="md">
              <h2 className="text-h2 font-bold text-charcoal">Word Reveal</h2>
              <p className="text-small text-stone">
                §6.4.1 — کاراکترها ۳۲ms stagger، ۱۲۰۰ms glacial، expo-out
              </p>
              <WordReveal className="text-[clamp(2rem,6vw,4rem)] font-black leading-[1.1] text-charcoal">
                ساخته‌شده برای ماندن
              </WordReveal>
            </Stack>

            <Stack gap="md">
              <h2 className="text-h2 font-bold text-charcoal">Block Reveal</h2>
              <p className="text-small text-stone">
                §6.4.2 — ۲۴px y-offset + opacity، ۷۲۰ms slow، out-soft
              </p>
              <BlockReveal>
                <div className="rounded-lg border border-sand bg-cream p-8">
                  <p className="text-body text-stone">
                    این بلوک با اسکرول ظاهر می‌شود — fade + slide up.
                  </p>
                </div>
              </BlockReveal>
              <div className="flex gap-4">
                <BlockReveal delay={0}>
                  <div className="rounded-lg bg-sand p-6 text-center text-small text-charcoal">
                    stagger 0
                  </div>
                </BlockReveal>
                <BlockReveal delay={0.08}>
                  <div className="rounded-lg bg-sand p-6 text-center text-small text-charcoal">
                    stagger 80ms
                  </div>
                </BlockReveal>
                <BlockReveal delay={0.16}>
                  <div className="rounded-lg bg-sand p-6 text-center text-small text-charcoal">
                    stagger 160ms
                  </div>
                </BlockReveal>
              </div>
            </Stack>

            <Stack gap="md">
              <h2 className="text-h2 font-bold text-charcoal">Image Reveal</h2>
              <p className="text-small text-stone">
                §6.4.3 — clip-path inset + scale 1.08→1.0، ۷۲۰ms، expo-out
              </p>
              <ImageReveal className="max-w-md">
                <div className="flex aspect-[3/2] items-center justify-center rounded-lg bg-sand">
                  <span className="select-none text-[6rem] font-black text-stone/25">ژ</span>
                </div>
              </ImageReveal>
            </Stack>

            <div className="border-t border-sand pt-8">
              <h2 className="text-h3 font-bold text-charcoal">یادداشت‌ها</h2>
              <p className="mt-2 text-small text-stone">
                هر الگوی حرکتی باید در برابر Core Web Vitals (LCP، INP، CLS)
                روی دستگاه اندروید میان‌رده سنجیده شود. هر چیزی که INP را
                بالای ۱۵۰ms ببرد، رد می‌شود.
              </p>
            </div>
          </Stack>
        </Container>
      </Section>

      <div className="h-[50vh]" aria-hidden />

      <Section padY="lg">
        <Container>
          <BlockReveal>
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-8 text-center">
              <p className="text-h3 font-bold text-charcoal">
                این بلوک بعد از اسکرول ظاهر می‌شود
              </p>
            </div>
          </BlockReveal>
        </Container>
      </Section>
    </>
  );
}
