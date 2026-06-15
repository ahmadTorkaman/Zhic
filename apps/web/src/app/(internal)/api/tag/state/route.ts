import { NextRequest, NextResponse } from 'next/server';
import { getTagUser, getTagToken } from '@/lib/tag/auth';
import { loadOccupancyState, loadProductState } from '@/lib/tag/state';
import { OCCUPANCIES } from '@/lib/tag/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getTagUser();
  const token = await getTagToken();
  if (!user || !token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const mode = req.nextUrl.searchParams.get('mode') ?? 'occupancy';

  if (mode === 'product') {
    const products = await loadProductState(token);
    const distribution = Object.fromEntries(
      OCCUPANCIES.map((o) => [o, products.filter((p) => p.occupancies.includes(o)).length]),
    );
    return NextResponse.json({ products, scoreboard: { productsTotal: products.length, distribution } });
  }

  const designs = await loadOccupancyState(token);
  const complete = designs.filter((d) => d.occupancies.length > 0 && d.occupancies.every((o) => d.posters.some((p) => p.occupancy === o))).length;
  return NextResponse.json({ designs, scoreboard: { designsComplete: complete, designsTotal: designs.length } });
}
