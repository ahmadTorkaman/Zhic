export const API_URL = process.env.API_URL ?? 'http://localhost:3001';
export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

/**
 * When true, the storefront emits noindex/nofollow at every layer
 * (robots.txt, <meta name="robots">, plus Caddy adds X-Robots-Tag header).
 * Tier 2 (zhic.ir) review environment sets NOINDEX=true.
 * Tier 3 (zhicwood.com) leaves it unset.
 */
export const NOINDEX = process.env.NOINDEX === 'true';
