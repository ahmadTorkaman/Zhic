import { describe, expect, it, afterEach, vi } from 'vitest';

describe('robots.ts', () => {
  const originalNoindex = process.env.NOINDEX;
  const originalSiteUrl = process.env.SITE_URL;

  afterEach(() => {
    vi.resetModules();
    if (originalNoindex === undefined) delete process.env.NOINDEX;
    else process.env.NOINDEX = originalNoindex;
    if (originalSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSiteUrl;
  });

  it('emits Disallow:/ and no sitemap when NOINDEX=true', async () => {
    process.env.NOINDEX = 'true';
    process.env.SITE_URL = 'https://zhic.ir';
    const { default: robots } = await import('../robots');
    const result = robots();
    expect(result.rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(result.sitemap).toBeUndefined();
  });

  it('allows / and disallows admin paths when NOINDEX is unset', async () => {
    delete process.env.NOINDEX;
    process.env.SITE_URL = 'https://zhicwood.com';
    const { default: robots } = await import('../robots');
    const result = robots();
    // The default branch returns rules with allow:/ + disallow array
    expect(result.rules).toMatchObject({ userAgent: '*', allow: '/' });
    expect(Array.isArray((result.rules as { disallow?: string[] }).disallow)).toBe(true);
    expect((result.rules as { disallow: string[] }).disallow).toContain('/admin');
    expect(result.sitemap).toBe('https://zhicwood.com/sitemap.xml');
  });
});
