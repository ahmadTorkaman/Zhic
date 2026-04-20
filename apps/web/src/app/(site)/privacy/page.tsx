import { LegalPage } from '@/components/editorial/LegalPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return { title: 'حریم خصوصی' };
}

export default async function PrivacyPage() {
  const page = await fetchPage('privacy');
  return (
    <LegalPage
      heading={page?.title ?? 'حریم خصوصی'}
      updatedLabel="۱ فروردین ۱۴۰۵"
      body={page?.body ?? null}
      breadcrumbItems={[{ label: 'حریم خصوصی' }]}
    />
  );
}
