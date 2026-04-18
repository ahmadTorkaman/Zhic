'use client';

import { Button, Container, Section, Stack } from '@zhic/ui';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Section padY="xl">
      <Container>
        <Stack gap="md" align="center" className="text-center">
          <h1 className="text-h2 font-bold text-charcoal">
            چیزی درست پیش نرفت
          </h1>
          <p className="max-w-xl text-lead text-stone">
            لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، با ما تماس بگیرید.
          </p>
          <Stack direction="row" gap="sm" className="flex-wrap justify-center">
            <Button onClick={reset} variant="primary">
              تلاش دوباره
            </Button>
            <Button as="a" href="/" variant="secondary">
              بازگشت به خانه
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
}
