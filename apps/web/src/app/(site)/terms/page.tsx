import { LegalPage } from '@/components/editorial/LegalPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return { title: 'شرایط استفاده' };
}

export default async function TermsPage() {
  const page = await fetchPage('terms');
  return (
    <LegalPage
      heading={page?.title ?? 'شرایط استفاده'}
      updatedLabel="۱ فروردین ۱۴۰۵"
      body={page?.body ?? null}
      breadcrumbItems={[{ label: 'شرایط استفاده' }]}
    />
  );
}
