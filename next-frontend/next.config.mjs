/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1htnxwo4o0jhw.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
