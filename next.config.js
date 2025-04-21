/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  // Optimize for Netlify deployment
  swcMinify: true,
};

module.exports = nextConfig;
