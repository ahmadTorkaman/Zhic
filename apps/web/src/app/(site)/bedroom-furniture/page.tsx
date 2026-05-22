import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import { fetchAllCategories, fetchAllDesigns } from '@/lib/payload';
import { ChildCategoriesGrid } from '@/components/category/ChildCategoriesGrid';

export const metadata: Metadata = {
  title: 'مبلمان اتاق خواب',
  description:
    'تمامی پیکربندی‌های مبلمان اتاق خواب ژیک — تخت، کمد، میز، کتابخانه، صندلی، آینه و مکمل‌های تخت.',
  alternates: { canonical: '/bedroom-furniture' },
};

export default async function BedroomFurnitureRootPage() {
  const [allCategories, allDesigns] = await Promise.all([
    fetchAllCategories(),
    fetchAllDesigns(),
  ]);

  // Top-level parents (no `parent` field) form the visual surface of this root.
  // The canonical tree has 7 of them: bed, table, storage, display, mirror,
  // seating, complement — plus the standalone `nightstand` leaf which Payload
  // also returns as parent === null. Both are surfaced here.
  const topLevel = allCategories.filter((c) => c.parent == null);

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs
            items={[{ label: 'خانه', href: '/' }, { label: 'مبلمان اتاق خواب' }]}
          />
        </div>
      </Container>

      {/* Hero — cream gradient on cream, matches the catalog's tonal language. */}
      <section
        aria-labelledby="bf-title"
        className="relative mt-6 overflow-hidden border-block-end border-sand"
        style={{ background: 'var(--color-cream)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(20,17,15,0.55) 100%), radial-gradient(ellipse at 30% 30%, #c9b094 0%, #6a4f30 55%, #2a1d10 100%)',
          }}
        />
        <Container>
          <div className="relative py-20 sm:py-24">
            <span className="text-eyebrow font-medium uppercase tracking-[var(--tracking-eyebrow-wide)] text-white/75">
              کاتالوگ کامل
            </span>
            <h1
              id="bf-title"
              className="mt-3 text-h1 font-black leading-tight text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              مبلمان اتاق خواب
            </h1>
            <p className="mt-4 max-w-xl text-body italic text-white/85">
              همه‌ی پیکربندی‌های ژیک — از تخت تا آینه — در هفت گروه با ساختار درختی.
              برای پیدا کردن آن‌چه می‌خواهید، از یکی از گروه‌های زیر شروع کنید.
            </p>
            <div className="mt-7 flex flex-wrap gap-9 border-block-start border-white/20 pt-6">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black leading-none text-white">
                  {toPersianDigits(topLevel.length)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/75">
                  گروه
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black leading-none text-white">
                  {toPersianDigits(allCategories.length)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/75">
                  دسته‌بندی
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black leading-none text-white">
                  {toPersianDigits(allDesigns.length)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/75">
                  طرح
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <main className="py-14">
          {topLevel.length === 0 ? (
            <p className="py-12 text-center text-stone">
              هنوز دسته‌بندی‌ای ثبت نشده. این صفحه پس از بارگذاری کاتالوگ تکمیل می‌شود.
            </p>
          ) : (
            <section aria-label="گروه‌های مبلمان">
              <header className="mb-7 flex items-baseline gap-3 border-block-start border-sand pt-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                  ★ گروه‌ها
                </span>
                <h2 className="text-h4 font-black text-ink">
                  از کجا شروع می‌کنید؟
                </h2>
                <span className="ms-auto text-[13px] text-stone">
                  {toPersianDigits(topLevel.length)} گروه
                </span>
              </header>
              <ChildCategoriesGrid items={topLevel} />
            </section>
          )}
        </main>
      </Container>
    </>
  );
}
