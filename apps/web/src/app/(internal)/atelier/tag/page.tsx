// apps/web/src/app/(internal)/atelier/tag/page.tsx
import { redirect } from 'next/navigation';
import { getTagUser } from '@/lib/tag/auth';
import { OccupancyMode } from './OccupancyMode';
import './tag-panel.css';

export const dynamic = 'force-dynamic';

export default async function TagPanelPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await getTagUser();
  if (!user) redirect('/atelier/tag/login');
  const { mode = 'occupancy' } = await searchParams;
  // M1 ships occupancy only; other modes land in M2–M4.
  return <OccupancyMode userEmail={user.email} initialMode={mode} />;
}
