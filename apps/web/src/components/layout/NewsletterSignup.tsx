'use client';

import { useState } from 'react';

export function NewsletterSignup() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, source: 'footer' }),
    });
    const json = await res.json().catch(() => ({}));
    setState(json.ok ? 'ok' : 'error');
    if (json.ok) setPhone('');
  }

  return (
    <form className="zh-news" onSubmit={onSubmit} noValidate>
      <div className="zh-news__row">
        <input
          type="tel"
          inputMode="numeric"
          required
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="شماره موبایل شما"
          aria-label="شماره موبایل برای خبرنامه"
          dir="ltr"
          autoComplete="tel"
          maxLength={13}
        />
        <button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? '...' : 'عضویت'}
        </button>
      </div>
      {state === 'ok' && <p className="zh-news__msg zh-news__msg--ok">عضویت شما ثبت شد.</p>}
      {state === 'error' && <p className="zh-news__msg zh-news__msg--err">شماره موبایل نامعتبر است یا خطایی پیش آمد. لطفاً دوباره تلاش کنید.</p>}
      <p className="zh-news__disclaimer">ماهی یک پیام، بدون اسپم. هر زمان می‌توانید لغو کنید.</p>
    </form>
  );
}
