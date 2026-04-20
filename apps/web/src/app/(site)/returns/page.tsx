import { LegalPage } from '@/components/editorial/LegalPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return { title: 'سیاست بازگشت کالا' };
}

export default async function ReturnsPage() {
  const page = await fetchPage('returns');
  return (
    <LegalPage
      heading={page?.title ?? 'سیاست بازگشت کالا'}
      updatedLabel="۱ فروردین ۱۴۰۵"
      body={page?.body ?? null}
      breadcrumbItems={[{ label: 'سیاست بازگشت کالا' }]}
    />
  );
}
