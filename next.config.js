/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '',
  assetPrefix: '',
  images: {
    unoptimized: true,
    domains: ['bitboard.me'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
      ],
    },
  ],
}

module.exports = nextConfig 