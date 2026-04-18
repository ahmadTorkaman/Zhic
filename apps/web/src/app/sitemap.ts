import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';
import { API_URL } from '@/lib/env';

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
  const [products, collections, categories, showrooms, articles, journalCategories, tags] =
    await Promise.all([
      fetchSlugs('products'),
      fetchSlugs('collections'),
      fetchSlugs('categories'),
      fetchSlugs('showrooms'),
      fetchSlugs('articles', '&where[status][equals]=published'),
      fetchSlugs('journal-categories'),
      fetchSlugs('tags'),
    ]);

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/products`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/journal`, changeFrequency: 'daily', priority: 0.9 },
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

  for (const c of categories) {
    entries.push({
      url: `${SITE_URL}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
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
