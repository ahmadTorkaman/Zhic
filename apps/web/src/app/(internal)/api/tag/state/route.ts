// apps/web/src/app/(internal)/api/tag/state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState } from '@/lib/tag/state';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const designs = await loadOccupancyState(token);

  // A design is "complete" when every declared occupancy has a poster assigned.
  const complete = designs.filter(
    (d) =>
      d.occupancies.length > 0 &&
      d.occupancies.every((o) => d.posters.some((p) => p.occupancy === o)),
  ).length;

  return NextResponse.json({
    designs,
    scoreboard: { designsComplete: complete, designsTotal: designs.length },
  });
}
