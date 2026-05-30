import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/env';

const PERSIAN_DIGITS = /[۰-۹]/g;
const ARABIC_DIGITS = /[٠-٩]/g;

/**
 * Normalize user-entered Iranian mobile numbers to the canonical 09xxxxxxxxx form.
 * Accepts Persian/Arabic-Indic digits, +98/98 country-code prefixes, and the
 * leading-zero-less 9xxxxxxxxx form. Returns null if it isn't a valid IR mobile.
 */
function normalizeIRMobile(input: string): string | null {
  const ascii = input
    .replace(PERSIAN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660));
  const digits = ascii.replace(/\D/g, '');
  let n = digits;
  if (n.startsWith('98')) n = '0' + n.slice(2);                  // +98 / 98 prefix
  else if (n.length === 10 && n.startsWith('9')) n = '0' + n;     // raw 9xxxxxxxxx
  return /^09\d{9}$/.test(n) ? n : null;
}

export async function POST(req: Request) {
  let body: { phone?: unknown; source?: unknown };
  try {
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      body = await req.json();
    } else {
      const form = await req.formData();
      body = { phone: form.get('phone'), source: form.get('source') };
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 });
  }

  const raw = typeof body.phone === 'string' ? body.phone : '';
  const phone = normalizeIRMobile(raw);
  if (!phone) {
    return NextResponse.json({ ok: false, error: 'invalid phone' }, { status: 400 });
  }

  const source = typeof body.source === 'string' ? body.source : 'footer';

  // Persist via Payload's REST API.
  const res = await fetch(`${API_URL}/api/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, source, subscribedAt: new Date().toISOString() }),
  });

  if (res.status === 201) {
    return NextResponse.json({ ok: true });
  }
  if (res.status === 400 || res.status === 409) {
    // Likely duplicate phone — treat as success for the user (idempotent UX).
    return NextResponse.json({ ok: true, already: true });
  }

  return NextResponse.json({ ok: false, error: 'server error' }, { status: 502 });
}
