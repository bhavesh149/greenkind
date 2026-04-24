import type { NextConfig } from 'next';

/** Local dev: API on 3000, Next on 3001 — override with API_REWRITE_URL if needed. */
const apiTarget = process.env.API_REWRITE_URL ?? 'http://127.0.0.1:3000';

const nextConfig: NextConfig = {
  transpilePackages: ['@greenkind/rbac', '@greenkind/validation'],
  async rewrites() {
    return [{ source: '/v1/:path*', destination: `${apiTarget}/v1/:path*` }];
  },
};

export default nextConfig;
