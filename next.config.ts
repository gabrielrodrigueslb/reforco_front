import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.9',
      },
    ],
  },
};

module.exports = {
  allowedDevOrigins: [
    '192.168.15.9',
    'local-origin.dev',
    '*.local-origin.dev',
    'localhost:3000',
    '192.168.15.9:3000',
  ],
};


export default nextConfig;
