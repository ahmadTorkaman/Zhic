import { Container, Button } from '@zhic/ui';

export function generateMetadata() {
  return {
    title: 'پیام شما ارسال شد',
    description: 'پیام شما با موفقیت دریافت شد. تیم ما در اسرع وقت پاسخ می‌دهد.',
    robots: { index: false, follow: false },
  };
}

export default function ThankYouPage() {
  return (
    <section className="py-[var(--space-11)]">
      <Container>
        <div className="mx-auto max-w-[560px] text-center">
          <div className="mb-6 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
            تماس با ژیک
          </div>
          <h1 className="mb-5 text-h2 font-black text-ink">پیام شما ارسال شد</h1>
          <p className="mb-8 text-lead font-light leading-[var(--leading-lead)] text-stone">
            از پیام شما سپاسگزاریم. تیم فروش ژیک در ساعات کاری با شما تماس خواهد گرفت.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button as="a" href="/" variant="primary" size="md">
              بازگشت به خانه
            </Button>
            <Button as="a" href="/products" variant="ghost" size="md">
              مشاهده‌ی محصولات
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
