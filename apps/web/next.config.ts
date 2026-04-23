import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
});

const nextConfig: NextConfig = {
  transpilePackages: ['@hd-farm/shared'],
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
