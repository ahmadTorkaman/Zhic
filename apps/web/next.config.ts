import type { NextConfig } from "next";

const ABR_ARVAN_S3_HOST = process.env.S3_ENDPOINT
  ? new URL(process.env.S3_ENDPOINT).hostname
  : 's3.ir-thr-at1.arvanstorage.ir';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['80.240.31.146'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: ABR_ARVAN_S3_HOST,
        pathname: '/zhic-media/**',
      },
      // Workspace fallback for local-disk media served from services/api at :3001
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: '80.240.31.146',
        port: '3001',
        pathname: '/api/media/**',
      },
      // Box serves media on its public storefront origin (:3000) via the
      // /api/media rewrite; allow it so local dev can render live catalog photos.
      {
        protocol: 'http',
        hostname: '80.240.31.146',
        port: '3000',
        pathname: '/api/media/**',
      },
    ],
  },
  async rewrites() {
    return [
      // Media lives on the Payload API (services/api) on loopback :3001, whose
      // port is NOT reachable from browsers. Proxy media through the storefront
      // origin so it's served same-origin from :3000. The API builds media URLs
      // with NEXT_PUBLIC_SERVER_URL set to the storefront origin (not :3001).
      // Scoped to /api/media so the storefront's own /api/* routes are untouched.
      { source: '/api/media/:path*', destination: 'http://127.0.0.1:3001/api/media/:path*' },
    ];
  },
  async headers() {
    return [
      // Media files are UUID-named (content-addressed), so they never mutate —
      // safe to cache for a year. Payload's media response has no Cache-Control,
      // which made the browser re-download all media on every navigation/refresh.
      // Applied to the proxied path so the headers ride the rewrite.
      {
        source: '/api/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/invoices', destination: '/invoices/index.html', permanent: false },
      { source: '/invoices/', destination: '/invoices/index.html', permanent: false },

      // IA rework 2026-05-23: piece-type tree moved to /bedroom-furniture, series
      // hubs moved to /bedroom-set, and the /products flat-index killed in Phase 4
      // (sub-project E cleanup). PDP route /products/[slug] is unaffected — the
      // source `/products` matches exactly, not /products/<slug>. 301 permanent so
      // search engines update.
      // Catalog audit 2026-06-26: each split design's merged teen+double bed was retired
      // and replaced by `{design}-bed-teen` + `{design}-bed-double`. 301 the old slug to the
      // double bed. (parla/loof/skate kept their `-bed` slug → no redirect.)
      ...['iron', 'lotus', 'lukaplus', 'verna', 'jacqueline', 'caroline', 'baloot', 'sento', 'elizabeth'].map(
        (d) => ({ source: `/products/${d}-bed`, destination: `/products/${d}-bed-double`, permanent: true }),
      ),

      { source: '/products', destination: '/bedroom-furniture', permanent: true },
      { source: '/categories', destination: '/bedroom-furniture', permanent: true },
      { source: '/categories/:path*', destination: '/bedroom-furniture/:path*', permanent: true },
      { source: '/designs', destination: '/bedroom-set', permanent: true },
      { source: '/designs/:path*', destination: '/bedroom-set/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
