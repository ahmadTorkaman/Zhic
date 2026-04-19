export default function Page() {
  return (
    <main className="bg-ivory text-ink p-6">
      <h1 className="text-h1 font-black">v2 — tokens loaded</h1>
      <p className="mt-4 text-body">If this background is `#FAFAF7` and the heading uses Ayandeh-ish weight, tokens resolved.</p>
      <div className="mt-6 flex gap-3">
        <span className="rounded-pill bg-charcoal px-4 py-1.5 text-eyebrow text-ivory">charcoal</span>
        <span className="rounded-pill bg-forest px-4 py-1.5 text-eyebrow text-ivory">forest</span>
        <span className="rounded-pill bg-gold px-4 py-1.5 text-eyebrow text-ink">gold</span>
      </div>
    </main>
  );
}
