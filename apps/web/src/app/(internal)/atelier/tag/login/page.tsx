'use client';
import { useActionState } from 'react';
import { Button, FormField, Input } from '@zhic/ui';
import { loginAction, type LoginState } from './actions';

const INITIAL: LoginState = {};

export default function TagLoginPage() {
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  return (
    <main style={{ maxWidth: 360, margin: '12vh auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>ورود به پنل برچسب‌گذاری</h1>
      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* FormField requires id prop to wire label htmlFor → input id */}
        <FormField label="ایمیل" id="tag-email">
          <Input id="tag-email" name="email" type="email" autoComplete="username" required />
        </FormField>
        <FormField label="رمز عبور" id="tag-password">
          <Input id="tag-password" name="password" type="password" autoComplete="current-password" required />
        </FormField>
        {state.error ? <p role="alert" style={{ color: 'var(--color-danger, #b00)' }}>{state.error}</p> : null}
        <Button type="submit" variant="primary" size="md" disabled={pending}>{pending ? 'در حال ورود…' : 'ورود'}</Button>
      </form>
    </main>
  );
}
