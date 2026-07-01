import type { MetadataRoute } from 'next';
import { SITE_URL, NOINDEX } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      // Intentionally no sitemap — don't help crawlers index the review tier.
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/preview',
        '/lab',
        '/account',
        '/checkout',
        '/cart',
        '/login',
        '/order',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
