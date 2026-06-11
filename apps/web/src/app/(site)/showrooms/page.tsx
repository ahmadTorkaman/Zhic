import { fetchAllShowrooms } from '@/lib/payload';
import { Container, Breadcrumbs } from '@zhic/ui';
import { ShowroomIndexGrid } from '@/components/showroom/ShowroomIndexGrid';

export function generateMetadata() {
  return { title: 'شعب' };
}

export default async function ShowroomsIndexPage() {
  const showrooms = await fetchAllShowrooms();

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'شعب' }]} />
        </div>
      </Container>

      <section className="py-9">
        <ShowroomIndexGrid showrooms={showrooms} />
      </section>

      <div className="pb-12" />
    </>
  );
}
