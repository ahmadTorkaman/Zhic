import { LegalPage } from '@/components/editorial/LegalPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return { title: 'ارسال و تحویل' };
}

export default async function ShippingPage() {
  const page = await fetchPage('shipping');
  return (
    <LegalPage
      heading={page?.title ?? 'ارسال و تحویل'}
      updatedLabel="۱ فروردین ۱۴۰۵"
      body={page?.body ?? null}
      breadcrumbItems={[{ label: 'ارسال و تحویل' }]}
    />
  );
}
