import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
}

export default withPayload(nextConfig)
