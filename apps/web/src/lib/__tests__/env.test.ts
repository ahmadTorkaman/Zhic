import { describe, expect, it, afterEach, vi } from 'vitest';

describe('env flags (NOINDEX + API_URL)', () => {
  const original = {
    NOINDEX: process.env.NOINDEX,
    VERCEL: process.env.VERCEL,
    API_URL: process.env.API_URL,
  };

  afterEach(() => {
    vi.resetModules();
    for (const k of ['NOINDEX', 'VERCEL', 'API_URL'] as const) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });

  async function load(env: Partial<Record<'NOINDEX' | 'VERCEL' | 'API_URL', string | undefined>>) {
    vi.resetModules();
    for (const k of ['NOINDEX', 'VERCEL', 'API_URL'] as const) {
      if (k in env) {
        if (env[k] === undefined) delete process.env[k];
        else process.env[k] = env[k];
      }
    }
    return import('../env');
  }

  // NOINDEX
  it('NOINDEX is true when NOINDEX="true"', async () => {
    expect((await load({ NOINDEX: 'true', VERCEL: undefined })).NOINDEX).toBe(true);
  });
  it('NOINDEX is false when unset and not on Vercel', async () => {
    expect((await load({ NOINDEX: undefined, VERCEL: undefined })).NOINDEX).toBe(false);
  });
  it('NOINDEX is false when NOINDEX="false"', async () => {
    expect((await load({ NOINDEX: 'false', VERCEL: undefined })).NOINDEX).toBe(false);
  });
  it('NOINDEX defaults to true on Vercel when unset (keep preview out of search)', async () => {
    expect((await load({ NOINDEX: undefined, VERCEL: '1' })).NOINDEX).toBe(true);
  });
  it('NOINDEX=false overrides the Vercel default (production opt-in)', async () => {
    expect((await load({ NOINDEX: 'false', VERCEL: '1' })).NOINDEX).toBe(false);
  });

  // API_URL
  it('API_URL defaults to loopback off Vercel', async () => {
    expect((await load({ API_URL: undefined, VERCEL: undefined })).API_URL).toBe('http://localhost:3001');
  });
  it('API_URL defaults to the VPS backend on Vercel', async () => {
    expect((await load({ API_URL: undefined, VERCEL: '1' })).API_URL).toBe('http://45.140.42.57:3001');
  });
  it('explicit API_URL always wins', async () => {
    expect((await load({ API_URL: 'http://example.test:9999', VERCEL: '1' })).API_URL).toBe(
      'http://example.test:9999',
    );
  });
});
