/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: 'C:/Users/user/Documents',
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
