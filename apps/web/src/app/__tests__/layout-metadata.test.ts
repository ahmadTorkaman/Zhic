import { describe, expect, it, afterEach, vi } from 'vitest';

vi.mock('next/font/local', () => ({
  default: () => ({ variable: '--font-ayandeh', className: 'ayandeh' }),
}));

describe('root layout metadata.robots', () => {
  const originalNoindex = process.env.NOINDEX;

  afterEach(() => {
    vi.resetModules();
    if (originalNoindex === undefined) delete process.env.NOINDEX;
    else process.env.NOINDEX = originalNoindex;
  });

  it('emits noindex/nofollow when NOINDEX=true', async () => {
    process.env.NOINDEX = 'true';
    const { metadata } = await import('../layout');
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
    });
  });

  it('omits robots field when NOINDEX is unset (defaults indexed)', async () => {
    delete process.env.NOINDEX;
    const { metadata } = await import('../layout');
    expect(metadata.robots).toBeUndefined();
  });
});
