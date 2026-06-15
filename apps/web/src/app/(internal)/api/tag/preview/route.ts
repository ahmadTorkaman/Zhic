// apps/web/src/app/(internal)/api/tag/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState } from '@/lib/tag/state';
import { buildDesignDiff, makeConfirmToken } from '@/lib/tag/ops';
import type { DesignEdit, FieldChange } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { edits?: DesignEdit[] } | null;
  if (!body?.edits?.length) return NextResponse.json({ changes: [], confirmToken: makeConfirmToken([], 'empty') });

  const state = await loadOccupancyState(token);
  const byId = new Map(state.map((d) => [d.designId, d]));
  const changes: FieldChange[] = [];
  for (const edit of body.edits) {
    const cur = byId.get(edit.designId);
    if (!cur) continue;
    changes.push(...buildDesignDiff(
      { designId: cur.designId, occupancies: cur.occupancies, occupancyMedia: cur.posters.map((p) => ({ occupancy: p.occupancy, image: p.imageId })) },
      edit,
    ));
  }
  // Static stamp (Date.now is fine in a route handler, unlike workflow scripts).
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return NextResponse.json({ changes, confirmToken: makeConfirmToken(changes, stamp) });
}
