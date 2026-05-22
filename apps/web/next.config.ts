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
    ],
  },
  async redirects() {
    return [
      { source: '/invoices', destination: '/invoices/index.html', permanent: false },
      { source: '/invoices/', destination: '/invoices/index.html', permanent: false },

      // IA rework 2026-05-23: piece-type tree moved to /bedroom-furniture, series
      // hubs moved to /bedroom-set. PDP route /products/[slug] is unaffected (this
      // redirect block only fires on /products itself, not /products/<slug>).
      // 301 permanent so search engines update their indexes.
      //
      // /products → /bedroom-furniture redirect deferred to Phase 4 (sub-E cleanup)
      // because the /bedroom-furniture root index page doesn't exist until Phase 3.
      // Until then, /products still serves the legacy filter index. Don't re-add
      // the redirect until the target page is real.
      { source: '/categories', destination: '/bedroom-furniture', permanent: true },
      { source: '/categories/:path*', destination: '/bedroom-furniture/:path*', permanent: true },
      { source: '/designs', destination: '/bedroom-set', permanent: true },
      { source: '/designs/:path*', destination: '/bedroom-set/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
