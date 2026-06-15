'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginToPayload } from '@/lib/tag/auth';
import { SESSION_COOKIE } from '@/lib/tag/config';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'ایمیل و رمز عبور لازم است.' };
  const result = await loginToPayload(email, password);
  if (!result) return { error: 'ورود ناموفق بود یا دسترسی ندارید.' };
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true, sameSite: 'lax', secure: false, // :3000 over http on the review VPS
    path: '/', maxAge: 60 * 60 * 24 * 7, // 7d, matches Payload token expiry
  });
  redirect('/atelier/tag');
}
