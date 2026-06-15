// apps/web/src/app/(internal)/api/tag/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState, loadProductState } from '@/lib/tag/state';
import { buildDesignDiff, buildProductDiff, buildMediaDiff, makeConfirmToken } from '@/lib/tag/ops';
import { payloadGet } from '@/lib/tag/payload-rest';
import type { DesignEdit, ProductEdit, MediaEdit, FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { mode?: 'occupancy' | 'product' | 'images'; edits?: unknown[] } | null;
  const mode = body?.mode ?? 'occupancy';
  const edits = body?.edits ?? [];
  if (!edits.length) return NextResponse.json({ changes: [], confirmToken: makeConfirmToken([], 'empty') });

  const changes: FieldChange[] = [];
  if (mode === 'images') {
    const ids = (edits as MediaEdit[]).map((e) => e.mediaId);
    const current = new Map<number, { alt: string | null; caption: string | null; decorative: boolean }>();
    await Promise.all(ids.map(async (id) => {
      const m = await payloadGet<{ id: number; alt?: string | null; caption?: string | null; decorative?: boolean | null }>(`/api/media/${id}?depth=0`, token);
      current.set(id, { alt: m.alt ?? null, caption: m.caption ?? null, decorative: !!m.decorative });
    }));
    for (const edit of edits as MediaEdit[]) {
      const cur = current.get(edit.mediaId);
      if (!cur) continue;
      changes.push(...buildMediaDiff({ mediaId: edit.mediaId, ...cur }, edit));
    }
  } else if (mode === 'product') {
    const state = await loadProductState(token);
    const byId = new Map(state.map((p) => [p.productId, p]));
    for (const edit of edits as ProductEdit[]) {
      const cur = byId.get(edit.productId);
      if (!cur) continue;
      changes.push(...buildProductDiff({ productId: cur.productId, occupancies: cur.occupancies }, edit));
    }
  } else {
    const state = await loadOccupancyState(token);
    const byId = new Map(state.map((d) => [d.designId, d]));
    for (const edit of edits as DesignEdit[]) {
      const cur = byId.get(edit.designId);
      if (!cur) continue;
      changes.push(...buildDesignDiff(
        { designId: cur.designId, occupancies: cur.occupancies, occupancyMedia: cur.posters.map((p) => ({ occupancy: p.occupancy, image: p.imageId })) },
        edit,
      ));
    }
  }
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return NextResponse.json({ changes, confirmToken: makeConfirmToken(changes, stamp) });
}
