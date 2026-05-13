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
    ];
  },
};

export default nextConfig;
