import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen bg-ivory text-ink p-12">
      <h1 className="text-h2 font-black mb-4">ژیک — v2 redesign in progress</h1>
      <p className="text-body text-stone mb-8">The site rebuild is happening at <Link href="/lab" className="underline underline-offset-4 hover:decoration-2">/lab</Link>. Each new component lands there for visual verification before being wired into pages.</p>
    </main>
  );
}
