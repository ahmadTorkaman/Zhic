import { SiteHeader } from '@/components/layout/SiteHeader';

export default function SiteHeaderDemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-24">
        <div className="mx-auto max-w-[var(--container-storefront)] px-4 lg:px-6">
          <h1 className="mb-4 text-h2 font-black text-ink">SiteHeader demo</h1>
          <p className="mb-8 text-body text-stone">
            Header is transparent at top; scroll down to see the bg-ivory/85 + backdrop-blur + sand border + shadow-subtle transition kick in at 60px scroll distance. On mobile (&lt;768px), the nav collapses to a hamburger that opens a full-screen <code>MobileMenu</code> overlay.
          </p>
          <p className="mb-8 text-small text-stone">
            Active nav state is derived from <code>usePathname()</code>. On this route <code>/lab/site-header</code>, no nav item matches so none should be highlighted.
          </p>

          {/* Long filler so we can scroll */}
          <div className="space-y-6">
            {Array.from({ length: 40 }, (_, i) => (
              <div key={i} className="rounded-lg bg-cream p-6">
                <h2 className="mb-2 text-h4 font-bold">Section {i + 1}</h2>
                <p className="text-body text-stone">
                  Lorem ipsum Persian placeholder content to make the page scrollable.
                  متن فارسی نمونه برای تست اسکرول. پس از عبور از ۶۰ پیکسل هدر باید حالت
                  بلور و مرز سنگی خود را بگیرد.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
