import { describe, expect, it } from 'vitest';
import {
  clampIndex, slot, flipAngle, activeLogoIndex,
  bandOpacity, bandBlurPx, flipOpacity,
  cardScale, cardOpacity, cardBlurPx, cardZIndex, isCulled,
  snapDuration, easeOutQuart,
} from '../carousel-math';

describe('clampIndex', () => {
  it('clamps to [0, n-1]', () => {
    expect(clampIndex(-2, 7)).toBe(0);
    expect(clampIndex(9, 7)).toBe(6);
    expect(clampIndex(3, 7)).toBe(3);
  });
});

describe('slot', () => {
  it('desktop: 0.95 × cardW(0.68) — neighbours peek', () => {
    // 800*0.68*0.703 = 382.432; *0.95 = 363.3104
    expect(slot(800, false)).toBeCloseTo(363.3104, 2);
  });
  it('mobile: 0.84 × cardW(0.52) — narrower card so neighbours peek at the edges', () => {
    // 844*0.52*0.703 = 308.53264; *0.84 = 259.1674176
    expect(slot(844, true)).toBeCloseTo(259.1674176, 2);
  });
});

describe('flipAngle (half-flip, never past ±90)', () => {
  it('tilts out 0→90 then in -90→0', () => {
    expect(flipAngle(0)).toBe(0);
    expect(flipAngle(0.25)).toBe(45);
    expect(flipAngle(0.5)).toBe(-90); // mockup uses `frac < 0.5`; exactly 0.5 takes the else branch → -90 (edge-on, visually identical to +90)
    expect(flipAngle(0.75)).toBe(-45);
    expect(flipAngle(1)).toBe(0);
  });
});

describe('activeLogoIndex', () => {
  it('lower logo while tilting out, upper while tilting in', () => {
    expect(activeLogoIndex(2, 3, 0.3)).toBe(2);
    expect(activeLogoIndex(2, 3, 0.5)).toBe(3);
    expect(activeLogoIndex(2, 3, 0.7)).toBe(3);
  });
});

describe('glass crossfade', () => {
  it('band/flip blur+fade peak at the crossover (frac=0.5)', () => {
    expect(bandOpacity(0)).toBeCloseTo(1, 5);
    expect(bandOpacity(0.5)).toBeCloseTo(1 - 0.82, 5); // sin(pi/2)=1
    expect(bandBlurPx(0.5)).toBe(12);
    expect(bandBlurPx(0)).toBe(0);
    expect(flipOpacity(0.5)).toBeCloseTo(1 - 0.9, 5);
  });
});

describe('card transforms', () => {
  it('scale/opacity/blur/z by absolute distance, with floors + cull', () => {
    expect(cardScale(0)).toBe(1);
    expect(cardScale(2)).toBe(0.5); // max(0.5, 1-0.52)
    expect(cardOpacity(0)).toBe(1);
    expect(cardOpacity(3)).toBe(0.14); // max(0.14, 1-1.2)
    expect(cardBlurPx(1)).toBe(4);
    expect(cardBlurPx(10)).toBe(16); // min(16, 40)
    expect(cardZIndex(0)).toBe(100);
    expect(cardZIndex(1)).toBe(90);
    expect(isCulled(2.2)).toBe(false);
    expect(isCulled(2.3)).toBe(true);
  });
});

describe('snapDuration', () => {
  it('clamps to [280, 640] around |dist|*440', () => {
    expect(snapDuration(0.1)).toBe(280);
    expect(snapDuration(1)).toBe(440);
    expect(snapDuration(2)).toBe(640);
  });
});

describe('easeOutQuart', () => {
  it('1-(1-t)^4', () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
    expect(easeOutQuart(0.5)).toBeCloseTo(0.9375, 5);
  });
});
