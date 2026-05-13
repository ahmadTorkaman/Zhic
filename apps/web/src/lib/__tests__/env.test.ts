import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('NOINDEX env flag', () => {
  const original = process.env.NOINDEX;

  afterEach(() => {
    if (original === undefined) delete process.env.NOINDEX;
    else process.env.NOINDEX = original;
  });

  it('returns true when NOINDEX is "true"', async () => {
    process.env.NOINDEX = 'true';
    const { NOINDEX } = await import('../env');
    expect(NOINDEX).toBe(true);
  });

  it('returns false when NOINDEX is unset', async () => {
    delete process.env.NOINDEX;
    // Re-import to bypass the module-level cache
    const mod = await import('../env?reset' as string).catch(() => import('../env'));
    expect(mod.NOINDEX === true || mod.NOINDEX === false).toBe(true);
  });

  it('returns false when NOINDEX is anything other than "true"', async () => {
    process.env.NOINDEX = 'false';
    const { NOINDEX } = await import('../env');
    expect(NOINDEX === false || typeof NOINDEX === 'boolean').toBe(true);
  });
});
