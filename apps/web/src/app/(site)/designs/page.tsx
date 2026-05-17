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
        <header className="py-9 text-center">
          <h1 className="text-h1 font-black text-ink">طرح‌ها</h1>
          <p className="mx-auto mt-3 max-w-[560px] text-lead font-light text-stone">
            هر طرح یک زبان طراحی است. کارت‌ها را کنار بزنید تا کل مجموعه را ببینید.
          </p>
        </header>
      </Container>

      <DesignsSlider designs={designs} />
    </>
  );
}
