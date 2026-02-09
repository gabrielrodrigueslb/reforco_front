import type { NextConfig } from 'next';

const stripTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const resolveUploadsBase = () => {
  const explicit = process.env.NEXT_PUBLIC_URLBASE_UPLOAD;
  if (explicit && explicit.trim()) return stripTrailingSlash(explicit.trim());
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && apiUrl.trim()) {
    return stripTrailingSlash(apiUrl.trim().replace(/\/api\/?$/, ''));
  }
  return '';
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4457',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.9',
      },
      {
        protocol: 'http',
        hostname: '192.168.15.9',
        port: '4457',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'reforcoadrianaoliveira.edukconecta.com',
        port: '4457',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'reforcoadrianaoliveira.edukconecta.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'reforcoadrianaoliveira.edukconecta.com',
      },
      {
        protocol: 'https',
        hostname: 'reforcoadrianaoliveira.edukconecta.com',
      },
    ],
  },
  allowedDevOrigins: [
    '192.168.15.9',
    'local-origin.dev',
    '*.local-origin.dev',
    'localhost:3000',
    '192.168.15.9:3000',
    '72.62.10.171'
  ],
  async rewrites() {
    const uploadsBase = resolveUploadsBase();
    if (!uploadsBase) return [];
    return [
      {
        source: '/uploads/:path*',
        destination: `${uploadsBase}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
