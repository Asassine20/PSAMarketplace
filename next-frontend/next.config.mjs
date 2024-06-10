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
  async rewrites() {
    return [
      {
        source: '/account',
        destination: '/sidepanel/account',
      },
      {
        source: '/address',
        destination: '/sidepanel/address',
      },
      {
        source: '/dashboard',
        destination: '/sidepanel/dashboard',
      },
      {
        source: '/grading',
        destination: '/sidepanel/grading',
      },
      {
        source: '/submission-form',
        destination: '/sidepanel/submission-form',
      },
      {
        source: '/orders',
        destination: '/sidepanel/orders',
      },
      {
        source: '/payment',
        destination: '/sidepanel/payment',
      },
      {
        source: '/seller',
        destination: '/sidepanel/seller',
      },
      {
        source: '/contact',
        destination: '/sidepanel/contact',
      },
      {
        source: '/refund',
        destination: '/sidepanel/refund',
      },
      {
        source: '/protection',
        destination: '/sidepanel/protection',
      },
      {
        source: '/about',
        destination: '/sidepanel/about',
      },
    ];
  },
};

export default nextConfig;
