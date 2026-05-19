import { SiteHeader } from '@/components/layout/SiteHeader';
import type { NavMeta } from '@/lib/payload';

const EMPTY_NAV_META: NavMeta = {
  categories: [],
  designs: [],
  collections: [],
  featuredProduct: null,
  featuredDesign: null,
  pieceCounts: {},
};

export default function SiteHeaderDemoPage() {
  return (
    <>
      <SiteHeader navMeta={EMPTY_NAV_META} />
      <main>
        {/* Dark hero band so you can SEE the header transparent-vs-scrolled contrast.
            Mimics how the header sits over a photo hero on the real homepage. */}
        <section
          aria-hidden
          className="relative flex h-[520px] items-end overflow-hidden bg-charcoal"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(20,17,15,0) 0%, rgba(20,17,15,0.65) 100%), radial-gradient(ellipse at 30% 20%, rgba(95,119,96,0.3), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(196,154,108,0.25), transparent 65%)',
          }}
        >
          <div className="mx-auto max-w-[var(--container-storefront)] px-4 pb-10 lg:px-6">
            <p className="mb-3 text-eyebrow uppercase tracking-[var(--eyebrow-tight)] text-sand/70">
              SITE HEADER DEMO
            </p>
            <h1 className="text-h2 font-black text-ivory">هدر ثابت با فعال‌سازی در اسکرول</h1>
            <p className="mt-3 max-w-2xl text-body text-sand/90">
              در بالای صفحه هدر شفاف است و متن برند روی این بند تیره دیده می‌شود. با اسکرول بیش از ۶۰
              پیکسل، پس‌زمینه به ایوری ۸۵٪ + بلور شیشه‌ای ۲۴px تبدیل می‌شود و یک مرز و سایه‌ی ظریف اضافه
              می‌کند.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[var(--container-storefront)] px-4 py-12 lg:px-6">
          <div className="space-y-6">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="rounded-lg bg-cream p-6">
                <h2 className="mb-2 text-h4 font-bold">Section {i + 1}</h2>
                <p className="text-body text-stone">
                  متن فارسی نمونه برای تست اسکرول. هنگام عبور از ۶۰ پیکسل، هدر باید حالت بلور + مرز sand +
                  سایه‌ی ظریف خود را بگیرد.
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
