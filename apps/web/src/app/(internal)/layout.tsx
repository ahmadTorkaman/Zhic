// apps/web/src/app/(internal)/layout.tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTagUser } from '@/lib/tag/auth';
import '../globals.css';

export const dynamic = 'force-dynamic'; // never cache an authed surface

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  // Login page renders its own minimal tree; skip the gate there.
  const pathname = (await headers()).get('x-invoke-path') ?? (await headers()).get('next-url') ?? '';
  if (!pathname.includes('/atelier/tag/login')) {
    const user = await getTagUser();
    if (!user) redirect('/atelier/tag/login');
  }
  return <div className="zh-tag-root" data-internal>{children}</div>;
}
