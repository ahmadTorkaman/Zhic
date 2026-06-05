// Pure carousel/flip math — ported verbatim from the bedroom-set-v2 mockup
// (index.html: slot/updateGlass/render/snapTo). Constants are the mockup's.

export const clampIndex = (p: number, n: number): number =>
  Math.max(0, Math.min(n - 1, p));

/** Per-card horizontal spacing. `mobile` = matchMedia('(max-width:768px)'). */
export function slot(innerWidth: number, innerHeight: number, mobile: boolean): number {
  const cardW = innerHeight * (mobile ? 0.58 : 0.68) * 0.703;
  return cardW + innerWidth * (mobile ? 0.1 : 0.07);
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

// Per-card transforms by absolute distance from the focused index.
export const cardScale = (absDist: number): number => Math.max(0.5, 1 - absDist * 0.26);
export const cardOpacity = (absDist: number): number => Math.max(0.14, 1 - absDist * 0.4);
export const cardBlurPx = (absDist: number): number => Math.min(16, Math.round(absDist * 7));
export const cardZIndex = (absDist: number): number => Math.round(100 - absDist * 10);
export const isCulled = (absDist: number): boolean => absDist > 2.2;

// Snap animation: duration clamped to [280, 640]; ease-out-quart.
export const snapDuration = (distance: number): number =>
  Math.min(640, Math.max(280, Math.abs(distance) * 440));
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
