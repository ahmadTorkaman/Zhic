// apps/web/src/app/(internal)/api/tag/undo/route.ts
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { payloadPatch } from '@/lib/tag/payload-rest';
import { readSnapshot, appendAudit, listSnapshotCollections } from '@/lib/tag/snapshot';
import { BACKUP_ROOT } from '@/lib/tag/config';

export const dynamic = 'force-dynamic';

/** Restore the snapshotted designs by re-PATCHing their saved occupancies + occupancyMedia. */
export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { backupDir?: string } | null;
  if (!body?.backupDir) return NextResponse.json({ error: 'backupDir required' }, { status: 400 });

  const resolved = path.resolve(body.backupDir);
  if (resolved !== path.resolve(BACKUP_ROOT) && !resolved.startsWith(path.resolve(BACKUP_ROOT) + path.sep)) {
    return NextResponse.json({ error: 'invalid-backup-dir' }, { status: 400 });
  }

  let collections: string[];
  try {
    collections = listSnapshotCollections(resolved);
  } catch (e) {
    return NextResponse.json({ error: `snapshot-read-failed: ${(e as Error).message}` }, { status: 404 });
  }

  let restored = 0;
  for (const col of collections) {
    const snap = readSnapshot(resolved, col);
    for (const doc of snap.docs) {
      const id = doc.id as number;
      const data: Record<string, unknown> = { occupancies: doc.occupancies ?? [] };
      if (col === 'designs') {
        data.occupancyMedia = ((doc.occupancyMedia as { occupancy: string; image: number | { id: number } }[] | null) ?? [])
          .map((m) => ({ occupancy: m.occupancy, image: typeof m.image === 'number' ? m.image : m.image?.id }));
      }
      await payloadPatch(col as 'designs' | 'products', id, data, token);
      restored++;
      try {
        appendAudit({ ts: new Date().toISOString(), user_id: user.id, mode: 'undo', op: 'undo', collection: col, target_id: id, backup_dir: resolved });
      } catch (e) { console.error('tag-undo: audit write failed', (e as Error).message); }
    }
  }
  for (const col of collections) revalidateTag(col, { expire: 0 });
  return NextResponse.json({ restored });
}
