/**
 * Pure offset math for ParallaxImage. Ported from
 * framer.com/m/ParallaxImage-prod-3M0qB4.js — vertical only.
 */
export type ParallaxInput = {
  /** getBoundingClientRect().top of the container, in CSS pixels. */
  rectTop: number;
  /** offsetHeight of the container, in CSS pixels. */
  containerHeight: number;
  /** window.innerHeight, in CSS pixels. */
  viewportHeight: number;
};

/**
 * Compute the vertical translation (in px) to apply to the inner image.
 * verticalAmount is a percentage (0-100): 80 means the image is 80% taller
 * than the container and can drift ±40% of containerHeight on full progress.
 */
export function computeParallaxOffset(input: ParallaxInput, verticalAmount: number): number {
  const { rectTop, containerHeight, viewportHeight } = input;
  if (containerHeight === 0) return 0;
  const total = viewportHeight + containerHeight;
  const progress = Math.max(0, Math.min(1, (viewportHeight - rectTop) / total));
  return (progress - 0.5) * (verticalAmount / 100) * containerHeight;
}
