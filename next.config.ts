import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lint runs in CI/editor; keep `next build` focused on types + bundling.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // AVIF first, WebP fallback: ~30-50% smaller than JPEG for the big template scenes.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1200, 1920, 2560],
  },
};

export default nextConfig;
