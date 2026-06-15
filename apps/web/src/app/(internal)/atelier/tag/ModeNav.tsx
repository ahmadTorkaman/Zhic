// apps/web/src/app/(internal)/atelier/tag/ModeNav.tsx
'use client';
import Link from 'next/link';

export function ModeNav({ active }: { active: 'occupancy' | 'product' }) {
  return (
    <nav className="zh-tag-nav">
      <Link href="/atelier/tag?mode=occupancy" className={active === 'occupancy' ? 'is-active' : ''}>اشغال طرح‌ها</Link>
      <Link href="/atelier/tag?mode=product" className={active === 'product' ? 'is-active' : ''}>اشغال محصولات</Link>
    </nav>
  );
}
