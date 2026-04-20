import { EditorialPage } from '@/components/editorial/EditorialPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return {
    title: 'کارگاه',
    description: 'کارگاه ژیک در همدان — جایی که چوب نفس می‌کشد.',
  };
}

export default async function AtelierPage() {
  const page = await fetchPage('atelier');
  return (
    <EditorialPage
      eyebrow="کارگاه ژیک"
      heading={page?.title ?? 'جایی که چوب نفس می‌کشد'}
      heroHeight="xl"
      body={page?.body ?? null}
      lead="کارگاه ما در قلب همدان، فضایی ۸۰۰ متری است که در آن هنر سنتی نجاری با ابزار مدرن ترکیب شده."
    />
  );
}
