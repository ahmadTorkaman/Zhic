// apps/web/src/app/(internal)/api/tag/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { payloadGet, payloadPatch } from '@/lib/tag/payload-rest';
import { writeSnapshot, appendAudit } from '@/lib/tag/snapshot';
import { makeConfirmToken } from '@/lib/tag/ops';
import type { FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { changes?: FieldChange[]; confirmToken?: string } | null;
  const changes = body?.changes ?? [];
  if (!changes.length) return NextResponse.json({ applied: 0, backupDir: '' });

  // Guard: the token must match the change set (rejects stale/forged previews).
  const stamp = (body!.confirmToken ?? '').split('.')[0] || '';
  if (makeConfirmToken(changes, stamp) !== body!.confirmToken) {
    return NextResponse.json({ error: 'stale-or-invalid-confirm-token' }, { status: 409 });
  }

  // 1) Snapshot the CURRENT designs about to change (hard-fail aborts apply).
  const ids = [...new Set(changes.map((c) => c.id))];
  const snapDocs: Record<string, unknown>[] = [];
  for (const id of ids) {
    const doc = await payloadGet<Record<string, unknown>>(`/api/designs/${id}?depth=0`, token);
    snapDocs.push(doc);
  }
  const label = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) + '-occupancy';
  let backupDir: string;
  try {
    backupDir = writeSnapshot(label, { designs: snapDocs });
  } catch (e) {
    return NextResponse.json({ error: `snapshot-failed: ${(e as Error).message}` }, { status: 500 });
  }

  // 2) Apply per-design (idempotent: PATCH the field to its `after` value). occupancyMedia
  //    `after` is [{occupancy, image:<id>}] — Payload accepts the numeric id for the upload rel.
  const byId = new Map<number, Record<string, unknown>>();
  for (const c of changes) {
    const cur = byId.get(c.id) ?? {};
    cur[c.field] = c.after;
    byId.set(c.id, cur);
  }
  let applied = 0;
  for (const [id, data] of byId) {
    await payloadPatch('designs', id, data, token);
    applied++;
    for (const c of changes.filter((x) => x.id === id)) {
      appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: 'occupancy', op: `set-${c.field}`, target_id: id, before: c.before, after: c.after, backup_dir: backupDir });
    }
  }

  // Next.js 16 requires a cache-life profile arg. This is a write path where the
  // operator expects their edit live immediately, so expire the 'designs' tag now.
  revalidateTag('designs', { expire: 0 });
  return NextResponse.json({ applied, backupDir });
}
