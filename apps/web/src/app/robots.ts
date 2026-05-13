import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  if (process.env.NOINDEX === 'true') {
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
