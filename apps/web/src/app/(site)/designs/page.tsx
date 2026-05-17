import { Container, Breadcrumbs } from '@zhic/ui';
import { DesignsSlider } from '@/components/design/DesignsSlider';
import { fetchAllDesigns } from '@/lib/payload';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/designs' },
};

export default async function DesignsIndexPage() {
  const designs = await fetchAllDesigns();
  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'طرح‌ها' }]} />
        </div>
        <header className="py-4 text-center md:py-9">
          <h1 className="text-[26px] font-black leading-tight text-ink md:text-h1">طرح‌ها</h1>
          <p className="mx-auto mt-2 max-w-[560px] text-[13px] font-light leading-relaxed text-stone md:mt-3 md:text-lead">
            هر طرح یک زبان طراحی است. کارت‌ها را کنار بزنید تا کل مجموعه را ببینید.
          </p>
        </header>
      </Container>

      <DesignsSlider designs={designs} />
    </>
  );
}
