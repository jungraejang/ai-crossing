import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@ai-crossing/shared',
    '@ai-crossing/ai',
    '@ai-crossing/simulation',
    '@ai-crossing/db',
  ],
};

export default nextConfig;
