import { describe, it, expect } from 'vitest';
import { computeParallaxOffset } from '../src/parallax-math';

describe('computeParallaxOffset', () => {
  const vh = 800;
  const ch = 500;

  it('returns 0 when the element is exactly centered in the viewport', () => {
    // element centered: rect.top = (vh - ch) / 2 = 150
    // progress = (vh - rect.top) / (vh + ch) = (800 - 150) / 1300 = 0.5
    const y = computeParallaxOffset({ rectTop: 150, containerHeight: ch, viewportHeight: vh }, 80);
    expect(y).toBeCloseTo(0, 5);
  });

  it('returns a negative offset when the element is near the top of the viewport', () => {
    // progress near 1 (bottom hits top): rect.top = -ch + 0 = -500
    // progress = (vh - rect.top) / (vh + ch) = 1300 / 1300 = 1
    // yOffset = (1 - 0.5) * (80/100) * ch = 0.5 * 0.8 * 500 = 200
    const y = computeParallaxOffset({ rectTop: -ch, containerHeight: ch, viewportHeight: vh }, 80);
    expect(y).toBeCloseTo(200, 1);
  });

  it('returns a positive offset (mirrored) when the element is below the viewport', () => {
    // progress = 0: rect.top = vh
    // yOffset = (0 - 0.5) * 0.8 * 500 = -200
    const y = computeParallaxOffset({ rectTop: vh, containerHeight: ch, viewportHeight: vh }, 80);
    expect(y).toBeCloseTo(-200, 1);
  });

  it('clamps progress to [0, 1]', () => {
    // way above viewport — should still produce the max positive offset, not unbounded
    const y = computeParallaxOffset({ rectTop: -10000, containerHeight: ch, viewportHeight: vh }, 80);
    expect(y).toBeCloseTo(200, 1);
  });

  it('scales linearly with verticalAmount', () => {
    const inputs = { rectTop: -ch, containerHeight: ch, viewportHeight: vh };
    expect(computeParallaxOffset(inputs, 40)).toBeCloseTo(100, 1);
    expect(computeParallaxOffset(inputs, 80)).toBeCloseTo(200, 1);
  });

  it('returns 0 when containerHeight is 0 (degenerate, no division-by-zero)', () => {
    const y = computeParallaxOffset({ rectTop: 0, containerHeight: 0, viewportHeight: vh }, 80);
    expect(y).toBe(0);
  });
});
