import { describe, expect, it } from 'vitest';
import { formatMoney } from '../src/format';

describe('formatMoney — defaults', () => {
  it('renders rials as Persian toman with suffix', () => {
    expect(formatMoney(84_000_000n)).toBe('۸٬۴۰۰٬۰۰۰ تومان');
  });

  it('renders zero', () => {
    expect(formatMoney(0n)).toBe('۰ تومان');
  });

  it('accepts a number input', () => {
    expect(formatMoney(84_000_000)).toBe('۸٬۴۰۰٬۰۰۰ تومان');
  });
});

describe('formatMoney — options', () => {
  it('uses ASCII digits when digits:en', () => {
    expect(formatMoney(84_000_000n, { digits: 'en' })).toBe('8,400,000 تومان');
  });

  it('displays rials when unit:rial', () => {
    expect(formatMoney(84_000_000n, { unit: 'rial' })).toBe('۸۴٬۰۰۰٬۰۰۰ ریال');
  });

  it('strips the suffix when suffix:none', () => {
    expect(formatMoney(84_000_000n, { suffix: 'none' })).toBe('۸٬۴۰۰٬۰۰۰');
  });

  it('supports rial unit with no suffix', () => {
    expect(formatMoney(84_000_000n, { unit: 'rial', suffix: 'none' }))
      .toBe('۸۴٬۰۰۰٬۰۰۰');
  });
});
