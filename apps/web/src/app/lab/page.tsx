import Link from 'next/link';

const experiments = [
  {
    slug: 'motion',
    label: 'Motion',
    note: 'Easings, durations, reveal patterns, scroll choreography.',
  },
  {
    slug: 'type',
    label: 'Typography',
    note: 'Display vs body pairings, scales, masked reveals, tracking.',
  },
  {
    slug: 'color',
    label: 'Color',
    note: 'Palette comparisons, contrast, surface treatments.',
  },
  {
    slug: 'three',
    label: '3D / WebXR',
    note: 'glTF viewer choices, draco/KTX2 budgets, AR placement.',
  },
];

export default function LabIndex() {
  return (
    <div>
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-accent">
        Experimentation surface
      </p>
      <h1 className="font-serif text-5xl font-light leading-tight md:text-7xl">
        The Lab
      </h1>
      <p className="mt-6 max-w-xl text-stone">
        A scratch space for trying things — motion, type, color, and 3D —
        before any of them earn a place in the design system. Every page in
        here is <code>noindex, nofollow</code>. Anything that survives gets
        promoted into <code>docs/design-system.md</code>.
      </p>

      <ul className="mt-16 grid gap-px border border-sand bg-sand md:grid-cols-2">
        {experiments.map((e) => (
          <li key={e.slug} className="bg-ivory">
            <Link
              href={`/lab/${e.slug}`}
              className="group block p-10 transition-colors hover:bg-cream"
            >
              <div className="mb-3 text-[10px] uppercase tracking-[0.4em] text-accent">
                Experiment
              </div>
              <h2 className="font-serif text-3xl font-light">{e.label}</h2>
              <p className="mt-3 max-w-sm text-sm text-stone">{e.note}</p>
              <div className="mt-8 text-[11px] uppercase tracking-[0.3em] text-charcoal opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
