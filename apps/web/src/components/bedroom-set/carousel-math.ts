// Pure carousel/flip math — ported from the bedroom-set-v2 mockup
// (index.html: slot/updateGlass/render/snapTo). The flip/glass constants are
// the mockup's; the card spacing + neighbour blur/opacity are tuned so the
// adjacent cards peek in at the screen edges as a swipe affordance
// (see slot / cardOpacity / cardBlurPx).

export const clampIndex = (p: number, n: number): number =>
  Math.max(0, Math.min(n - 1, p));

/**
 * Per-card horizontal spacing. `mobile` = matchMedia('(max-width:768px)').
 * Tighter than the card width so the adjacent cards peek in at the screen
 * edges (the swipe affordance) — the mockup's wider gap pushed them off-screen
 * on phones, which is why the carousel didn't read as swipeable.
 */
export function slot(innerHeight: number, mobile: boolean): number {
  const cardW = innerHeight * (mobile ? 0.52 : 0.68) * 0.703;
  return cardW * (mobile ? 0.84 : 0.95);
}

// Half-flip: tilt OUT to 90° (edge-on), swap the visible logo, tilt back IN.
// Angle never leaves ±90°, so a logo can never be seen upside-down.
export const flipAngle = (frac: number): number =>
  frac < 0.5 ? frac * 180 : frac * 180 - 180;

export const activeLogoIndex = (lo: number, hi: number, frac: number): number =>
  frac < 0.5 ? lo : hi;

// Glass band + flip crossfade — 0 at a card, peaks at the crossover (frac=0.5).
const crossfadeMid = (frac: number): number => Math.sin(frac * Math.PI);
export const bandOpacity = (frac: number): number => 1 - crossfadeMid(frac) * 0.82;
export const bandBlurPx = (frac: number): number => Math.round(crossfadeMid(frac) * 12);
export const flipOpacity = (frac: number): number => 1 - crossfadeMid(frac) * 0.9;

// Per-card transforms by absolute distance from the focused index. The
// immediate neighbours are kept brighter + sharper than the mockup so the
// peeking sliver clearly reads as "another card you can swipe to".
export const cardScale = (absDist: number): number => Math.max(0.5, 1 - absDist * 0.26);
export const cardOpacity = (absDist: number): number => Math.max(0.14, 1 - absDist * 0.34);
export const cardBlurPx = (absDist: number): number => Math.min(16, Math.round(absDist * 4));
export const cardZIndex = (absDist: number): number => Math.round(100 - absDist * 10);
export const isCulled = (absDist: number): boolean => absDist > 2.2;

// Snap animation: duration clamped to [280, 640]; ease-out-quart.
export const snapDuration = (distance: number): number =>
  Math.min(640, Math.max(280, Math.abs(distance) * 440));
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
