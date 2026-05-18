import { Container, ParallaxImage } from '@zhic/ui';

export default function LabParallaxImagePage() {
  return (
    <main className="min-h-screen bg-ivory">
      <Container>
        <div className="py-10">
          <h1 className="mb-4 text-h2 font-black text-ink">Lab — ParallaxImage</h1>
          <p className="mb-7 max-w-[640px] text-body text-stone">
            Scroll past each tile to feel the parallax. Reduced-motion users see the image centered with no transform.
          </p>
        </div>

        <div className="flex flex-col gap-7 pb-[80vh]">
          {[40, 80, 120].map((amount) => (
            <section key={amount} aria-label={`Amount ${amount}`}>
              <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-stone">
                amount = {amount}
              </div>
              <ParallaxImage
                src="/hero/IMG_0889.jpeg"
                alt="Test parallax"
                verticalAmount={amount}
                topRightRadius={48}
                className="aspect-[4/5] w-full max-w-[420px]"
              />
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
