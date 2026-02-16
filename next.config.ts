import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
<<<<<<< HEAD
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
=======
  reactStrictMode: true, // ✅ Bonnes pratiques React

  // ✅ TypeScript - Build fails on errors (sécurité)
  typescript: {
    ignoreBuildErrors: false,
  },

  // ✅ Optimisations images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ✅ Compression
  compress: true,

  // ✅ Headers sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
>>>>>>> 28e5996de76f6540c72c6c5f6ef9530f4cda1d98
};

export default nextConfig;
