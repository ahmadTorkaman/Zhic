// apps/web/src/lib/tag/__tests__/auth.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
import { isAllowedRole, verifyToken } from '../auth';

afterEach(() => vi.unstubAllGlobals());

describe('isAllowedRole', () => {
  it('accepts admin/editor/marketing, rejects others', () => {
    expect(isAllowedRole('admin')).toBe(true);
    expect(isAllowedRole('marketing')).toBe(true);
    expect(isAllowedRole('viewer')).toBe(false);
    expect(isAllowedRole(undefined)).toBe(false);
  });
});

describe('verifyToken', () => {
  it('returns the user when /me ok + role allowed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: { id: 6, email: 'a@b.c', role: 'admin' } }), { status: 200 })));
    expect(await verifyToken('tok')).toEqual({ id: 6, email: 'a@b.c', role: 'admin' });
  });
  it('returns null on disallowed role', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: { id: 7, email: 'x@y.z', role: 'customer' } }), { status: 200 })));
    expect(await verifyToken('tok')).toBeNull();
  });
  it('returns null on 401', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    expect(await verifyToken('bad')).toBeNull();
  });
});
