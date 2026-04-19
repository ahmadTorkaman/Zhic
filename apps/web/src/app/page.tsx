export default function Page() {
  return (
    <main className="bg-ivory text-ink p-12">
      <h1 className="text-h1 font-black mb-8">v2 — base.css surfaces</h1>

      <section className="mb-12 grid grid-cols-3 gap-5">
        <div className="glass-card rounded-lg p-6">
          <div className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest mb-2">تهران</div>
          <h3 className="text-h4 font-bold mb-2">شوروم ونک</h3>
          <p className="text-small text-stone">خیابان ونک، خیابان شهید خدامی</p>
        </div>
        <div className="glass-card rounded-lg p-6">
          <div className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest mb-2">اصفهان</div>
          <h3 className="text-h4 font-bold mb-2">شوروم چهارباغ</h3>
          <p className="text-small text-stone">خیابان چهارباغ بالا</p>
        </div>
        <div className="glass-card rounded-lg p-6">
          <div className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest mb-2">همدان</div>
          <h3 className="text-h4 font-bold mb-2">کارگاه مرکزی</h3>
          <p className="text-small text-stone">بلوار استاد شهریار</p>
        </div>
      </section>

      <section className="bg-ink p-12 -mx-12">
        <div className="glass-card-dark rounded-lg p-7 max-w-md">
          <h3 className="text-h4 font-bold text-ivory mb-3">glass-card-dark</h3>
          <p className="text-small text-sand">Frosted glass on ink background, used for the contact form and home CTA form.</p>
        </div>
      </section>
    </main>
  );
}
