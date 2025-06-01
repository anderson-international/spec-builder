/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.shopify.com'], // Allow images from Shopify CDN
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/login',
        permanent: false,
      },
    ];
  },
  // Optimize build for Netlify
  output: 'standalone',
  // Enable webpack caching for faster builds
  webpack: (config, { dev, isServer }) => {
    // Only enable cache in dev mode
    if (dev) {
      config.cache = true;
    }
    return config;
  }
}

module.exports = nextConfig
