// apps/web/src/app/(internal)/layout.tsx
import '../globals.css';

export const dynamic = 'force-dynamic';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <div className="zh-tag-root" data-internal>{children}</div>;
}
