import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin'; // Import the plugin

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

// Wrap the config with the next-intl plugin, pointing to your i18n config file
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
