import { Container, CountUp } from '@zhic/ui';

export default function LabCountUpPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <Container>
        <div className="py-10">
          <h1 className="mb-4 text-h2 font-black text-ink">Lab — CountUp</h1>
          <p className="max-w-[640px] text-body text-stone">
            Scroll down past the buffer. Each counter animates from ۰ once, on first scroll-into-view.
          </p>
        </div>
      </Container>

      <div className="flex h-[80vh] items-center justify-center bg-cream text-small text-stone">
        ↓ scroll past this to trigger ↓
      </div>

      <section className="bg-forest-dark py-10 text-ivory">
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="border-s-2 border-gold ps-5">
              <div className="text-h2 font-black text-ivory">
                <CountUp value={25} suffix="+" />
              </div>
              <div className="mt-1 text-small font-light text-sand">سال تجربه</div>
            </div>
            <div className="border-s-2 border-gold ps-5">
              <div className="text-h2 font-black text-ivory">
                <CountUp value={1200} suffix="+" />
              </div>
              <div className="mt-1 text-small font-light text-sand">قطعه تولیدشده</div>
            </div>
            <div className="border-s-2 border-gold ps-5">
              <div className="text-h2 font-black text-ivory">
                <CountUp value={3} />
              </div>
              <div className="mt-1 text-small font-light text-sand">شوروم</div>
            </div>
          </div>
        </Container>
      </section>

      <div className="h-[80vh]" aria-hidden />
    </main>
  );
}
