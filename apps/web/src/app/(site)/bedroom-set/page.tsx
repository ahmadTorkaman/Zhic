import { DesignsSlider } from '@/components/design/DesignsSlider';
import { fetchAllDesigns } from '@/lib/payload';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/bedroom-set' },
};

export default async function DesignsIndexPage() {
  const designs = await fetchAllDesigns();
  // The slider owns the entire viewport (fixed positioning) and handles its
  // own breadcrumb + skip-link chrome in the top row; no surrounding Container.
  return <DesignsSlider designs={designs} />;
}
