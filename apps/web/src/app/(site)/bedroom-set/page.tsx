import { DesignsSlider } from '@/components/design/DesignsSlider';
import { fetchAllDesigns } from '@/lib/payload';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/bedroom-set' },
};

export default async function DesignsIndexPage() {
  const designs = await fetchAllDesigns();
  // The slider takes one viewport of height (in normal flow) and handles its
  // own breadcrumb + skip-link chrome. Add additional sections below as
  // siblings to <DesignsSlider> — the page scrolls past the slider naturally.
  return <DesignsSlider designs={designs} />;
}
