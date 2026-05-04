import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['80.240.31.146'],
  async redirects() {
    return [
      { source: '/invoices', destination: '/invoices/index.html', permanent: false },
      { source: '/invoices/', destination: '/invoices/index.html', permanent: false },
    ];
  },
};

export default nextConfig;
