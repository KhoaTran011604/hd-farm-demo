import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
});

const nextConfig: NextConfig = {
  transpilePackages: ['@hd-farm/shared'],
  reactStrictMode: true,
  webpack(config) {
    // Map explicit .js imports (required by NodeNext in @hd-farm/shared) to .ts sources
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
