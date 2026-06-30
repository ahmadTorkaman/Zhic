/**
 * SEO metadata helper.
 *
 * Merges Payload `seo.*` overrides with route-level defaults to produce
 * a Next.js `Metadata` object. Every override is optional — falls back
 * gracefully when fields are blank.
 *
 * Usage in a page's generateMetadata:
 *   import { buildMetadata } from '@/lib/seo';
 *   export async function generateMetadata({ params }) {
 *     const article = await fetchArticle(slug);
 *     return buildMetadata({
 *       seo: article?.seo,
 *       title: article?.title,
 *       description: article?.excerpt,
 *       path: `/journal/${slug}`,
 *       image: article?.cover ? mediaUrl(article.cover) : undefined,
 *     });
 *   }
 */

import type { Metadata } from 'next';
import type { PayloadSeo, PayloadMedia } from './payload';
import { SITE_URL } from './env';

function mediaToUrl(media?: PayloadMedia | null): string | undefined {
  if (!media?.url) return undefined;
  // OG/canonical images must be ABSOLUTE on the public origin (https on Vercel).
  // The API may bake a backend host into media.url — strip it to the path and
  // re-root on SITE_URL so the image is served same-origin (proxied to the API).
  let path: string;
  try {
    path = new URL(media.url).pathname;
  } catch {
    path = media.url;
  }
  return `${SITE_URL}${path}`;
}

export type BuildMetadataInput = {
  /** The collection's seo.* group — overrides the fallbacks below when set. */
  seo?: PayloadSeo | null;
  /** Fallback title — e.g. article.title, product.name, category.name. */
  title?: string | null;
  /** Fallback description — e.g. article.excerpt, product.shortDescription. */
  description?: string | null;
  /** Fallback cover image used for OG when seo.ogImage is blank. */
  image?: string;
  /** Route path (used to build absolute canonical URL). */
  path?: string;
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const title = input.seo?.metaTitle || input.title || undefined;
  const description = input.seo?.metaDescription || input.description || undefined;

  // OG image: prefer explicit seo override, then fallback cover image
  const ogImageOverride = mediaToUrl(input.seo?.ogImage);
  const ogImage = ogImageOverride || input.image;

  const canonical = input.seo?.canonicalUrl || input.path;

  const meta: Metadata = {};
  if (title) meta.title = title;
  if (description) meta.description = description;
  if (canonical) meta.alternates = { canonical };
  if (input.seo?.noindex) {
    meta.robots = { index: false, follow: false };
  }
  if (title || description || ogImage) {
    meta.openGraph = {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      ...(canonical ? { url: canonical } : {}),
    };
    meta.twitter = {
      card: 'summary_large_image',
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    };
  }
  return meta;
}
