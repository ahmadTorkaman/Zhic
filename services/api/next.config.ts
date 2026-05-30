import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pre-existing sharp type mismatch (upstream @payloadcms/next version skew).
  // Remove once the payload peer dep is upgraded.
  typescript: { ignoreBuildErrors: true },
  // Server Action origin guard — Next rejects Server Actions from origins
  // it doesn't recognize. Without this, admin login submits silently fail
  // and the user bounces back to /admin/login.
  experimental: {
    serverActions: {
      allowedOrigins: [
        '80.240.31.146:3001',
        'localhost:3001',
        '127.0.0.1:3001',
        // Add real domain here once DNS is pointed at this box:
        // 'api.zhicwood.com',
      ],
    },
  },
  // allowedDevOrigins for HMR from external IPs (only used in dev; harmless in prod)
  allowedDevOrigins: ['80.240.31.146'],
  async headers() {
    return [
      // Media files are UUID-named (content-addressed) — immutable. Payload's
      // upload handler doesn't set Cache-Control by default, so the browser
      // re-downloaded the full ~2.5MB media payload on every navigation.
      // Setting it here means BOTH direct :3001 and storefront-proxied :3000
      // consumers get the long-cache. Safe forever; a content change yields
      // a new UUID.
      {
        source: '/api/media/file/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
}

export default withPayload(nextConfig)
