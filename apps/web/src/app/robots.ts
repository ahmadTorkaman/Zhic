import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
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
