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
        <header className="pb-2 pt-1 text-center md:pb-3 md:pt-2">
          <h1 className="text-[20px] font-black leading-tight text-ink md:text-[28px]">طرح‌ها</h1>
        </header>
      </Container>

      <DesignsSlider designs={designs} />
    </>
  );
}
