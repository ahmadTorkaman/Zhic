'use client';

import { useState } from 'react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'footer' }),
    });
    const json = await res.json().catch(() => ({}));
    setState(json.ok ? 'ok' : 'error');
    if (json.ok) setEmail('');
  }

  return (
    <form className="zh-news" onSubmit={onSubmit} noValidate>
      <div className="zh-news__row">
        <input
          type="email"
          required
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ایمیل شما"
          aria-label="ایمیل برای خبرنامه"
          dir="ltr"
        />
        <button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? '...' : 'عضویت'}
        </button>
      </div>
      {state === 'ok' && <p className="zh-news__msg zh-news__msg--ok">عضویت شما ثبت شد.</p>}
      {state === 'error' && <p className="zh-news__msg zh-news__msg--err">خطایی پیش آمد. لطفاً دوباره تلاش کنید.</p>}
      <p className="zh-news__disclaimer">ماهی یک ایمیل، بدون اسپم. هر زمان می‌توانید لغو کنید.</p>
    </form>
  );
}
