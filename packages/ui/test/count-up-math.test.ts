import { describe, it, expect } from 'vitest';
import { easeOutCubic, formatCountUpValue } from '../src/count-up-math';

describe('easeOutCubic', () => {
  it('returns 0 at t=0 and 1 at t=1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is monotonically increasing', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 10; i++) {
      const v = easeOutCubic(i / 10);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  it('decelerates near t=1 (ease-out shape)', () => {
    // The curve's derivative at t=1 should be near 0; check the last delta is small.
    const a = easeOutCubic(0.9);
    const b = easeOutCubic(1.0);
    const c = easeOutCubic(0.1);
    const d = easeOutCubic(0.2);
    expect(b - a).toBeLessThan(d - c);
  });
});

describe('formatCountUpValue', () => {
  it('formats a number with Persian digits, no suffix', () => {
    expect(formatCountUpValue(1200, '')).toBe('۱۲۰۰');
  });

  it('appends a suffix verbatim', () => {
    expect(formatCountUpValue(25, '+')).toBe('۲۵+');
  });

  it('handles 0', () => {
    expect(formatCountUpValue(0, '+')).toBe('۰+');
  });

  it('rounds non-integers to the nearest integer before formatting', () => {
    expect(formatCountUpValue(12.7, '')).toBe('۱۳');
    expect(formatCountUpValue(12.3, '')).toBe('۱۲');
  });
});
