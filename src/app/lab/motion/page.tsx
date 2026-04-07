export default function MotionLab() {
  return (
    <article className="prose-zhic max-w-3xl">
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-accent">
        Lab · Motion
      </p>
      <h1 className="font-serif text-5xl font-light leading-tight">
        Motion experiments
      </h1>
      <p className="mt-6 text-stone">
        Use this page to try out reveal patterns, easings, durations, and
        scroll choreography. Add named experiments below as components, with
        a short note on what you are testing and what you measured.
      </p>

      <h2 className="mt-16 font-serif text-2xl font-light">Test queue</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone">
        <li>Word-mask reveal: Cormorant 96px, 32ms stagger, 1200ms ease-expo-out.</li>
        <li>Block reveal: 24px y-offset + opacity, 720ms, 20% threshold.</li>
        <li>Image clip-path reveal paired with inner 1.08 → 1.0 scale.</li>
        <li>Marquee speed: 40s vs 60s loop, pause-on-hover behavior.</li>
        <li>Page transition veil: 600ms ease-in-out vs in-place swap.</li>
        <li>Lenis lerp 0.06 vs 0.08 vs 0.1 — measure INP impact.</li>
      </ul>

      <h2 className="mt-16 font-serif text-2xl font-light">Notes</h2>
      <p className="mt-4 text-sm text-stone">
        Each experiment must be measured against Core Web Vitals (LCP, INP,
        CLS) on a mid-range Android, not just visual taste. Anything that
        regresses INP above 150ms is rejected regardless of how it looks.
      </p>
    </article>
  );
}
