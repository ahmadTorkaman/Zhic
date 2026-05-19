import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/env';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown };
  try {
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      body = await req.json();
    } else {
      const form = await req.formData();
      body = { email: form.get('email'), source: form.get('source') };
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid email' }, { status: 400 });
  }

  const source = typeof body.source === 'string' ? body.source : 'footer';

  // Persist via Payload's REST API.
  const res = await fetch(`${API_URL}/api/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source, subscribedAt: new Date().toISOString() }),
  });

  if (res.status === 201) {
    return NextResponse.json({ ok: true });
  }
  if (res.status === 400 || res.status === 409) {
    // Likely duplicate email — treat as success for the user (idempotent UX).
    return NextResponse.json({ ok: true, already: true });
  }

  return NextResponse.json({ ok: false, error: 'server error' }, { status: 502 });
}
