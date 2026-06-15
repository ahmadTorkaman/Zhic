// apps/web/src/lib/tag/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { ALLOWED_ROLES, type TagUser } from './types';
import { PAYLOAD_API, SESSION_COOKIE } from './config';

export function isAllowedRole(role: string | null | undefined): boolean {
  return !!role && (ALLOWED_ROLES as readonly string[]).includes(role);
}

/** Verify a JWT against Payload /api/users/me and gate on role. Returns user or null. */
export async function verifyToken(token: string): Promise<TagUser | null> {
  let res: Response;
  try {
    res = await fetch(`${PAYLOAD_API}/api/users/me`, { headers: { Authorization: `JWT ${token}` }, cache: 'no-store' });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { user?: { id: number; email: string; role: string } | null } | null;
  const user = data?.user;
  if (!user || !isAllowedRole(user.role)) return null;
  return { id: user.id, email: user.email, role: user.role };
}

/** Read the panel session cookie and verify it. */
export async function getTagUser(): Promise<TagUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getTagToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Exchange credentials for a JWT via Payload login (server-side). */
export async function loginToPayload(email: string, password: string): Promise<{ token: string; role: string } | null> {
  let res: Response;
  try {
    res = await fetch(`${PAYLOAD_API}/api/users/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { token?: string; user?: { role?: string } } | null;
  if (!data?.token || !isAllowedRole(data.user?.role)) return null;
  return { token: data.token, role: data.user!.role! };
}
