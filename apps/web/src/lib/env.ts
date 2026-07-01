/**
 * Server-side base URL of the Payload API used by all SSR data fetches
 * (`payloadFetch`). On Vercel the storefront is deployed as an HTTPS preview
 * while the VPS (45.140.42.57:3001) stays the backend, so default to the VPS
 * there — otherwise an unset API_URL would fall back to loopback and every
 * fetch would fail (empty storefront / "database not loaded"). Mirrors the
 * MEDIA_ORIGIN VERCEL fallback in next.config.ts. An explicit API_URL always wins.
 */
export const API_URL =
  process.env.API_URL ??
  (process.env.VERCEL ? 'http://45.140.42.57:3001' : 'http://localhost:3001');

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

/**
 * When true, the storefront emits noindex/nofollow at every layer
 * (robots.txt Disallow:/, <meta name="robots">, and an X-Robots-Tag header).
 *
 * - Any environment: `NOINDEX=true` forces it (Tier 2 zhic.ir review box; Caddy
 *   also adds X-Robots-Tag there).
 * - Vercel: defaults to **true** — the Vercel deploy is the temporary preview
 *   (zhicwood.store) and must stay out of search engines. Set `NOINDEX=false`
 *   to let a Vercel deployment be indexed (e.g. real production zhicwood.com).
 * - VPS Tier 3 (zhicwood.com): leave unset → indexed.
 */
export const NOINDEX =
  process.env.NOINDEX === 'true' ||
  (!!process.env.VERCEL && process.env.NOINDEX !== 'false');
