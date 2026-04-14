const swatches = [
  { token: 'ivory', hex: '#FAFAF7', use: 'Page background, canvas' },
  { token: 'cream', hex: '#F5F0EB', use: 'Panels, alt sections' },
  { token: 'sand', hex: '#E8E0D8', use: 'Dividers, hairlines, hover fills' },
  { token: 'stone', hex: '#8C8279', use: 'Secondary text, captions' },
  { token: 'charcoal', hex: '#2C2825', use: 'Primary text, headlines' },
  { token: 'ink', hex: '#14110F', use: 'Near-black, used sparingly' },
  { token: 'accent', hex: '#B8A898', use: 'Brand neutral accent (warm taupe)' },
  { token: 'gold', hex: '#B8915A', use: 'Reserved — once per page maximum' },
  { token: 'rust', hex: '#8B4A2B', use: 'Error / warning, muted' },
  { token: 'moss', hex: '#5A6B4F', use: 'Success, muted' },
];

export default function ColorLab() {
  return (
    <article>
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-accent">
        Lab · Color
      </p>
      <h1 className="font-serif text-5xl font-light leading-tight">
        Color experiments
      </h1>
      <p className="mt-6 max-w-2xl text-stone">
        The current palette is a placeholder waiting for the brand spec
        hand-off. Use this page to compare swatches in context, test
        contrast pairs, and try alternative tonal directions.
      </p>

      <section className="mt-16 grid grid-cols-2 gap-px border border-sand bg-sand md:grid-cols-3 lg:grid-cols-5">
        {swatches.map((s) => (
          <div key={s.token} className="bg-ivory">
            <div
              className="aspect-square w-full border-b border-sand/40"
              style={{ background: s.hex }}
            />
            <div className="p-4">
              <div className="font-serif text-lg">{s.token}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-stone">
                {s.hex}
              </div>
              <p className="mt-2 text-xs text-stone">{s.use}</p>
            </div>
          </div>
        ))}
      </section>

      <h2 className="mt-20 font-serif text-2xl font-light">To test</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone">
        <li>Charcoal-on-ivory vs ink-on-ivory for body text — measure WCAG and feel.</li>
        <li>Single accent vs dual accent (taupe + muted gold).</li>
        <li>Section background rotation: ivory → cream → ivory rhythm.</li>
        <li>Warm vs neutral hairline (sand vs pure neutral grey).</li>
      </ul>
    </article>
  );
}
