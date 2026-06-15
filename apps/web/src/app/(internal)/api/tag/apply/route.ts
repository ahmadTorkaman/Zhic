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

  // Guard: reject any change whose collection+field pair is outside our managed set.
  const VALID_FIELDS_BY_COLLECTION: Record<string, Set<string>> = {
    designs: new Set(['occupancies', 'occupancyMedia']),
    products: new Set(['occupancies']),
    media: new Set(['alt', 'caption', 'decorative']),
  };
  if (changes.some((c) => !VALID_FIELDS_BY_COLLECTION[c.collection]?.has(c.field))) {
    return NextResponse.json({ error: 'invalid-change' }, { status: 400 });
  }

  // Guard: the token must match the change set (rejects stale/forged previews).
  const stamp = (body!.confirmToken ?? '').split('.')[0] || '';
  if (makeConfirmToken(changes, stamp) !== body!.confirmToken) {
    return NextResponse.json({ error: 'stale-or-invalid-confirm-token' }, { status: 409 });
  }

  // Group changes by collection.
  const collections = [...new Set(changes.map((c) => c.collection))];

  // 1) Snapshot the CURRENT docs about to change, per collection (hard-fail aborts apply).
  const label = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) + '-tag';
  let backupDir: string;
  try {
    const byCollection: Record<string, unknown[]> = {};
    for (const col of collections) {
      const ids = [...new Set(changes.filter((c) => c.collection === col).map((c) => c.id))];
      byCollection[col] = await Promise.all(
        ids.map((id) => payloadGet<Record<string, unknown>>(`/api/${col}/${id}?depth=0`, token)),
      );
    }
    backupDir = writeSnapshot(label, byCollection);
  } catch (e) {
    return NextResponse.json({ error: `snapshot-failed: ${(e as Error).message}` }, { status: 500 });
  }

  // 2) Apply: group changed fields by (collection,id), PATCH each doc once.
  const byDoc = new Map<string, { collection: 'designs' | 'products' | 'media'; id: number; data: Record<string, unknown> }>();
  for (const c of changes) {
    const key = `${c.collection}:${c.id}`;
    const entry = byDoc.get(key) ?? { collection: c.collection, id: c.id, data: {} as Record<string, unknown> };
    (entry.data as Record<string, unknown>)[c.field] = c.after;
    byDoc.set(key, entry);
  }
  let applied = 0;
  for (const { collection, id, data } of byDoc.values()) {
    await payloadPatch(collection, id, data, token);
    applied++;
    for (const c of changes.filter((x) => x.collection === collection && x.id === id)) {
      try {
        appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: collection === 'products' ? 'product' : collection === 'media' ? 'images' : 'occupancy', op: `set-${c.field}`, target_id: id, collection, before: c.before, after: c.after, backup_dir: backupDir });
      } catch (e) {
        console.error('tag-apply: audit write failed', (e as Error).message);
      }
    }
  }

  for (const col of collections) revalidateTag(col, { expire: 0 });
  return NextResponse.json({ applied, backupDir });
}
