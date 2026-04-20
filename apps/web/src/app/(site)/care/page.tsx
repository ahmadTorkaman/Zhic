import { EditorialPage } from '@/components/editorial/EditorialPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return {
    title: 'مراقبت و گارانتی',
    description: 'راهنمای نگهداری از مبلمان چوبی ژیک.',
  };
}

export default async function CarePage() {
  const page = await fetchPage('care');
  return (
    <EditorialPage
      eyebrow="راهنما"
      heading={page?.title ?? 'مراقبت و گارانتی'}
      heroHeight="md"
      body={page?.body ?? null}
      lead="با مراقبت درست، مبلمان چوبی دست‌ساز ژیک نسل‌ها ماندگار می‌شود. راهنمای ساده برای نگهداری روزانه و فصلی."
    />
  );
}
