import type { PayloadCategory } from './payload';
import { deriveDescriptionFromIntro } from './category-helpers';

type Crumb = { label: string; href?: string };
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhicwood.com';

export function categoryCollectionPageLd(category: PayloadCategory) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.tagline ?? deriveDescriptionFromIntro(category.intro) ?? undefined,
    url: `${SITE_URL}/bedroom-furniture/${category.slug}`,
    image: category.cover?.url ?? undefined,
    isPartOf: { '@type': 'WebSite', name: 'ژیک', url: SITE_URL },
  };
}

export function breadcrumbListLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };
}
