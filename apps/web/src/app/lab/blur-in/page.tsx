import { Container, BlurInText } from '@zhic/ui';

export default function LabBlurInPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <Container>
        <div className="py-10">
          <h1 className="mb-4 text-h2 font-black text-ink">Lab — BlurInText</h1>
          <p className="max-w-[640px] text-body text-stone">
            Each block reveals word-by-word as it scrolls into view, once.
          </p>
        </div>
      </Container>

      <div className="h-[80vh] flex items-center justify-center bg-cream text-small text-stone">
        ↓ scroll ↓
      </div>

      <section className="bg-ivory py-10">
        <Container>
          <BlurInText as="h2" className="mb-5 text-h2 font-black text-ink">
            ساخته‌شده برای ماندن
          </BlurInText>
          <BlurInText as="p" className="max-w-[600px] text-lead font-light text-stone">
            مبلمان دست‌ساز از چوب گردوی ایرانی، برای خانه‌هایی که آرامش را می‌فهمند.
          </BlurInText>
        </Container>
      </section>

      <div className="h-[80vh]" aria-hidden />

      <section className="bg-forest-dark py-10 text-ivory">
        <Container>
          <BlurInText as="h2" className="mb-5 text-h2 font-black text-ivory">
            از همدان، برای ایران
          </BlurInText>
          <BlurInText as="p" className="max-w-[600px] text-body font-light text-sand">
            ژیک در کارگاهی در همدان متولد شد — جایی که سنت کار با چوب ریشه در قرن‌ها دارد.
          </BlurInText>
        </Container>
      </section>

      <div className="h-[80vh]" aria-hidden />
    </main>
  );
}
