import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';
import { API_URL } from '@/lib/env';
import { fetchAllCategories } from '@/lib/payload';

type PayloadDoc = { slug: string; updatedAt?: string };
type PayloadList = { docs: PayloadDoc[] };

async function fetchSlugs(collection: string, query = ''): Promise<PayloadDoc[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/${collection}?limit=1000&depth=0${query}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as PayloadList;
    return data.docs ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, designs, showrooms, articles, journalCategories, tags, allCategories] =
    await Promise.all([
      fetchSlugs('products'),
      fetchSlugs('collections'),
      fetchSlugs('designs'),
      fetchSlugs('showrooms'),
      fetchSlugs('articles', '&where[status][equals]=published'),
      fetchSlugs('journal-categories'),
      fetchSlugs('tags'),
      fetchAllCategories(),
    ]);

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1.0 },
    // /products index removed from sitemap: it's the killed sub-E flat catalog.
    // Phase 3 adds /bedroom-furniture root index in its place. /products/[slug]
    // PDPs are still emitted in the products loop below.
    { url: `${SITE_URL}/journal`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/bedroom-set`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/showrooms`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/atelier`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/care`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/events`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE_URL}/returns`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE_URL}/shipping-and-delivery`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  for (const p of products) {
    entries.push({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const c of collections) {
    entries.push({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  for (const d of designs) {
    entries.push({
      url: `${SITE_URL}/bedroom-set/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  for (const c of allCategories) {
    entries.push({
      url: `${SITE_URL}/bedroom-furniture/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: c.parent ? 0.7 : 0.75,
    });
  }

  for (const s of showrooms) {
    entries.push({
      url: `${SITE_URL}/showrooms/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  for (const a of articles) {
    entries.push({
      url: `${SITE_URL}/journal/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const jc of journalCategories) {
    entries.push({
      url: `${SITE_URL}/journal/category/${jc.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const t of tags) {
    entries.push({
      url: `${SITE_URL}/journal/tag/${t.slug}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return entries;
}
