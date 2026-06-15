// apps/web/src/lib/tag/__tests__/auth.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
import { isAllowedRole, verifyToken, loginToPayload } from '../auth';

afterEach(() => vi.unstubAllGlobals());

describe('isAllowedRole', () => {
  it('accepts admin/editor/marketing, rejects others', () => {
    expect(isAllowedRole('admin')).toBe(true);
    expect(isAllowedRole('editor')).toBe(true);
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

describe('loginToPayload', () => {
  it('returns {token, role} for valid creds with an allowed role', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ token: 'jwt123', user: { role: 'editor' } }), { status: 200 })));
    expect(await loginToPayload('a@b.c', 'pw')).toEqual({ token: 'jwt123', role: 'editor' });
  });
  it('returns null when credentials are valid but role is disallowed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ token: 'jwt123', user: { role: 'customer' } }), { status: 200 })));
    expect(await loginToPayload('a@b.c', 'pw')).toBeNull();
  });
  it('returns null on failed login (401)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    expect(await loginToPayload('a@b.c', 'bad')).toBeNull();
  });
});
