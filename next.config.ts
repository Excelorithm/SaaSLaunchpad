import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    if (process.env.STORAGE_PROVIDER === 'local' || !process.env.STORAGE_PROVIDER) {
      return [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
