/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
    missingSuspenseWithCSRBailout: false,
  },
  // Redirect old routes if needed
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
