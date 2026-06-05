import { BedroomSetLanding } from '@/components/bedroom-set/BedroomSetLanding';
import { DESIGNS, FEATURED_PAGES, WRITING } from '@/components/bedroom-set/placeholder-data';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/bedroom-set' },
};

export default function BedroomSetPage() {
  return <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />;
}
