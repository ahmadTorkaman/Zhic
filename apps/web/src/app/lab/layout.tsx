import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Lab — Zhic',
  description: 'Internal experimentation surface. Not indexed.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

const experiments = [
  { slug: 'tokens', label: 'Tokens' },
  { slug: 'locale', label: 'Locale' },
  { slug: 'ui', label: 'UI' },
  { slug: 'motion', label: 'Motion' },
  { slug: 'type', label: 'Typography' },
  { slug: 'color', label: 'Color' },
  { slug: 'three', label: '3D / WebXR' },
];

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-50 border-b border-sand/60 bg-ivory/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <Link
            href="/lab"
            className="font-sans text-lg tracking-wide"
          >
            Zhic · Lab
          </Link>
          <nav className="flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-stone">
            {experiments.map((e) => (
              <Link
                key={e.slug}
                href={`/lab/${e.slug}`}
                className="transition-colors hover:text-charcoal"
              >
                {e.label}
              </Link>
            ))}
            <Link
              href="/"
              className="ml-4 border-l border-sand pl-6 transition-colors hover:text-charcoal"
            >
              ← Site
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-6 py-16">{children}</main>
      <footer className="border-t border-sand/60 px-6 py-6 text-center text-[10px] uppercase tracking-[0.3em] text-stone/70">
        Internal · Not indexed · Experiments are not production
      </footer>
    </div>
  );
}
