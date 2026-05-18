export type JournalRowInput = {
  /** getBoundingClientRect().top of the parallax section. */
  rectTop: number;
  /** offsetHeight of the parallax section. */
  sectionHeight: number;
  /** window.innerHeight. */
  viewportHeight: number;
};

/**
 * Pure row-offset math for the home journal three-row scroll parallax.
 * `speed` is signed (negative = drift in the opposite direction). `max` is the
 * absolute peak displacement in px when t = ±1.
 */
export function computeRowOffset(input: JournalRowInput, speed: number, max: number): number {
  const { rectTop, sectionHeight, viewportHeight } = input;
  if (sectionHeight === 0) return 0;
  const total = viewportHeight + sectionHeight;
  const progress = Math.max(0, Math.min(1, (viewportHeight - rectTop) / total));
  const t = (progress - 0.5) * 2; // -1 .. +1
  return t * speed * max;
}
