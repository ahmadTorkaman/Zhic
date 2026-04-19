/**
 * /lab — component gallery. Every component built in v2 lands here
 * with its prop variants, so they can be eyeball-verified against
 * the mockups at http://80.240.31.146:9090/.superpowers/.
 *
 * Components are added section by section as they ship. Each section
 * is a labelled <section> with a heading and the component instances.
 */
export default function LabPage() {
  return (
    <main className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-sand bg-ivory/85 backdrop-blur">
        <div className="mx-auto max-w-[var(--container-storefront)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-h4 font-black text-ink">ژیک — Lab</h1>
            <p className="text-small text-stone">v2 component gallery</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[var(--container-storefront)] px-6 py-12">
        <p className="mb-12 max-w-prose text-body text-stone">
          Components are added here as they ship. Compare each with its mockup at
          {' '}<a href="http://80.240.31.146:9090/.superpowers/" className="underline underline-offset-4 hover:decoration-2" target="_blank" rel="noreferrer">superpowers</a>.
        </p>
        <div className="space-y-16">
          <section id="empty">
            <h2 className="mb-4 text-h2 font-black text-ink">Empty</h2>
            <p className="text-small text-stone">No components yet — Phase 1 ships the foundations only. Atoms arrive in Phase 2.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
