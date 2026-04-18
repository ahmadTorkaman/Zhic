import type { Metadata } from 'next';
import { Button, Container, Section, Stack } from '@zhic/ui';

export const metadata: Metadata = {
  title: 'با تشکر',
  alternates: { canonical: '/thank-you' },
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <Section padY="xl">
      <Container>
        <Stack gap="lg" align="center">
          <p className="text-small uppercase tracking-wide text-stone">
            با تشکر
          </p>
          <h1 className="text-display font-bold text-charcoal text-balance text-center">
            پیام شما دریافت شد
          </h1>
          <p className="text-lead text-stone text-center max-w-prose">
            همکاران ما در اسرع وقت با شما تماس خواهند گرفت. اگر سؤال فوری
            دارید، می‌توانید مستقیماً با شوروم مرکزی تماس بگیرید.
          </p>
          <Stack direction="row" gap="md" justify="center">
            <Button as="a" href="/" variant="primary" size="md">
              بازگشت به خانه
            </Button>
            <Button as="a" href="/products" variant="secondary" size="md">
              مشاهده محصولات
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
}
