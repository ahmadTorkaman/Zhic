import { BedroomSetLanding } from '@/components/bedroom-set/BedroomSetLanding';
import { DESIGNS, FEATURED_PAGES, WRITING } from '@/components/bedroom-set/placeholder-data';
import {
  fetchBedroomSetDesigns,
  fetchBedroomSetFeatured,
  fetchBedroomSetCopy,
} from '@/components/bedroom-set/server-data';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/bedroom-set' },
};

export default async function BedroomSetPage() {
  const [designs, pages, writing] = await Promise.all([
    fetchBedroomSetDesigns(),
    fetchBedroomSetFeatured(),
    fetchBedroomSetCopy(),
  ]);

  // Fall back to the bundled placeholder content if Payload is unreachable, so the
  // hub never renders empty.
  return (
    <BedroomSetLanding
      designs={designs.length ? designs : DESIGNS}
      pages={pages.length ? pages : FEATURED_PAGES}
      writing={writing ?? WRITING}
    />
  );
}
