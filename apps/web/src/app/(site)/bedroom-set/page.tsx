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
  const [designs, copy] = await Promise.all([
    fetchBedroomSetDesigns(),
    fetchBedroomSetCopy(),
  ]);

  // Featured-overlay media stays the curated FEATURED_PAGES art (operator
  // decision — NOT product galleries); only the per-page intro caption is
  // CMS-driven from the bedroom-set global. Page 0 = bestsellers, page 1 =
  // newest; fall back to each page's placeholder intro when the CMS field is empty.
  const pages = FEATURED_PAGES.map((p, i) => {
    const cms = i === 0 ? copy.featuredIntros.bestsellers : i === 1 ? copy.featuredIntros.newest : null;
    return cms ? { ...p, intro: cms } : p;
  });

  // Fall back to the bundled placeholder content if Payload is unreachable, so the
  // hub never renders empty.
  return (
    <BedroomSetLanding
      designs={designs.length ? designs : DESIGNS}
      pages={pages}
      writing={copy.writing ?? WRITING}
    />
  );
}
