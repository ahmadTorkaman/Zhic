import { fetchAllShowrooms } from '@/lib/payload';
import { Container, Breadcrumbs } from '@zhic/ui';
import { ShowroomIndexGrid } from '@/components/showroom/ShowroomIndexGrid';

export function generateMetadata() {
  return { title: 'شوروم‌ها' };
}

export default async function ShowroomsIndexPage() {
  const showrooms = await fetchAllShowrooms();

  return (
    <>
      <Container>
        <div className="pt-6">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'شوروم‌ها' }]} />
        </div>
      </Container>

      <section className="py-9">
        <ShowroomIndexGrid showrooms={showrooms} />
      </section>

      <div className="pb-12" />
    </>
  );
}
