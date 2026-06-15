// apps/web/src/app/(internal)/api/tag/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState, loadProductState } from '@/lib/tag/state';
import { buildDesignDiff, buildProductDiff, makeConfirmToken } from '@/lib/tag/ops';
import type { DesignEdit, ProductEdit, FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { mode?: 'occupancy' | 'product'; edits?: unknown[] } | null;
  const mode = body?.mode ?? 'occupancy';
  const edits = body?.edits ?? [];
  if (!edits.length) return NextResponse.json({ changes: [], confirmToken: makeConfirmToken([], 'empty') });

  const changes: FieldChange[] = [];
  if (mode === 'product') {
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
