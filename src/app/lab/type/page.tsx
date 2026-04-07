const sizes = [
  { token: 'text-display', px: 96, sample: 'Slow mornings' },
  { token: 'text-h1', px: 64, sample: 'Where rest becomes ritual' },
  { token: 'text-h2', px: 48, sample: 'A bedroom is a quiet room' },
  { token: 'text-h3', px: 32, sample: 'Belgian linen, hand-finished' },
  { token: 'text-h4', px: 24, sample: 'Aurora — sculptural upholstered bed' },
  { token: 'text-lead', px: 20, sample: 'Handcrafted in our New York atelier.' },
  { token: 'text-body', px: 16, sample: 'A bed should be the last object you choose for a room, and the first one you trust.' },
];

export default function TypeLab() {
  return (
    <article>
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-accent">
        Lab · Typography
      </p>
      <h1 className="font-serif text-5xl font-light leading-tight">
        Typography experiments
      </h1>
      <p className="mt-6 max-w-2xl text-stone">
        Pairings, scale, tracking, and balance. The current placeholder
        pairing is Cormorant Garamond + Inter; the brand spec hand-off may
        replace one or both. Treat the values below as starting points only.
      </p>

      <section className="mt-16 space-y-12">
        {sizes.map((s) => (
          <div key={s.token} className="border-b border-sand/60 pb-8">
            <div className="mb-3 flex items-baseline gap-4 text-[10px] uppercase tracking-[0.3em] text-stone">
              <span>{s.token}</span>
              <span>{s.px}px</span>
            </div>
            <p
              className={
                s.px >= 32
                  ? 'font-serif font-light text-charcoal'
                  : 'font-sans text-charcoal'
              }
              style={{ fontSize: `${s.px}px`, lineHeight: s.px >= 64 ? 1.05 : 1.4 }}
            >
              {s.sample}
            </p>
          </div>
        ))}
      </section>

      <h2 className="mt-20 font-serif text-2xl font-light">To test</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone">
        <li>Cormorant 300 vs 400 at display sizes.</li>
        <li>Inter vs alternatives (Söhne, Suisse Int&apos;l) at body 16px.</li>
        <li>Optical adjustments to tracking on uppercase eyebrows.</li>
        <li>Variable font axis sweeps — does INK weight read better at 12px?</li>
      </ul>
    </article>
  );
}
