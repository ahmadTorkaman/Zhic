import { BedroomSetLanding } from '@/components/bedroom-set/BedroomSetLanding';
import { DESIGNS, FEATURED_PAGES, WRITING } from '@/components/bedroom-set/placeholder-data';
import {
  fetchBedroomSetDesigns,
  fetchBedroomSetCopy,
} from '@/components/bedroom-set/server-data';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/bedroom-set' },
};

export default async function BedroomSetPage() {
  const [designs, writing] = await Promise.all([
    fetchBedroomSetDesigns(),
    fetchBedroomSetCopy(),
  ]);

  // Fall back to the bundled placeholder content if Payload is unreachable, so the
  // hub never renders empty.
  return (
    <BedroomSetLanding
      designs={designs.length ? designs : DESIGNS}
      // Featured-overlay media is the curated bedroom-set-v2 mockup art
      // (FEATURED_PAGES) by operator decision — NOT product galleries.
      // fetchBedroomSetFeatured stays in server-data if a CMS-driven
      // overlay is ever wanted again.
      pages={FEATURED_PAGES}
      writing={writing ?? WRITING}
    />
  );
}
