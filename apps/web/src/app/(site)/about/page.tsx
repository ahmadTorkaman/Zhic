import { EditorialPage } from '@/components/editorial/EditorialPage';
import { fetchPage } from '@/lib/payload';

export function generateMetadata() {
  return {
    title: 'درباره‌ی ما',
    description: 'داستان ژیک — از همدان، برای ایران.',
  };
}

export default async function AboutPage() {
  const page = await fetchPage('about');
  return (
    <EditorialPage
      eyebrow="درباره‌ی ژیک"
      heading={page?.title ?? 'از همدان، برای ایران'}
      heroHeight="lg"
      body={page?.body ?? null}
      lead="ژیک در سال ۱۳۸۰ در کارگاهی کوچک در همدان متولد شد — شهری که سنت کار با چوب در آن ریشه در قرن‌ها دارد."
    />
  );
}
