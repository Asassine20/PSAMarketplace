/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['d1htnxwo4o0jhw.cloudfront.net', 'media.licdn.com'],
  },
  async rewrites() {
    return [
      {
        source: '/account',
        destination: '/sidepanel/account',
      },
      {
        source: '/addresses',
        destination: '/sidepanel/addresses',
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
        source: '/order-history',
        destination: '/sidepanel/order-history',
      },
      {
        source: '/messages',
        destination: '/sidepanel/messages',
      },
      {
        source: '/payments',
        destination: '/sidepanel/payment-methods',
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
        destination: '/sidepanel/refund-return-policy',
      },
      {
        source: '/protection',
        destination: '/sidepanel/gemtcg-order-protection',
      },
      {
        source: '/about',
        destination: '/sidepanel/about',
      },
    ];
  },
};

export default nextConfig;
