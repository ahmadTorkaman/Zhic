// apps/web/src/app/(internal)/atelier/tag/page.tsx
import { redirect } from 'next/navigation';
import { getTagUser } from '@/lib/tag/auth';
import { OccupancyMode } from './OccupancyMode';
import { ProductMode } from './ProductMode';
import './tag-panel.css';

export const dynamic = 'force-dynamic';

export default async function TagPanelPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await getTagUser();
  if (!user) redirect('/atelier/tag/login');
  const { mode = 'occupancy' } = await searchParams;
  if (mode === 'product') return <ProductMode />;
  return <OccupancyMode userEmail={user.email} initialMode={mode} />;
}
